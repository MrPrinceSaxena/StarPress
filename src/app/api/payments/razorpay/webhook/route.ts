// =============================================================================
// POST /api/payments/razorpay/webhook
// Idempotent, fail-closed Razorpay Webhook processor — Phase A5
// Source of truth for PAID status
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  recordPaymentSuccess,
  recordPaymentFailure,
  isProductionEnvironment,
} from "@/server/payments";
import { getOrderById } from "@/server/orders";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Read raw body string directly — NEVER re-serialize JSON before HMAC verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    const isProd = isProductionEnvironment();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      if (isProd) {
        console.error("[Webhook Security Alert] RAZORPAY_WEBHOOK_SECRET is not configured in production. Rejecting unsigned webhook.");
        return NextResponse.json(
          { error: "Webhook secret is not configured on server." },
          { status: 500 }
        );
      }
      console.warn("[Webhook Dev Warning] RAZORPAY_WEBHOOK_SECRET not set in non-production.");
    }

    // 2. Cryptographic signature check on raw body
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("[Webhook Security Alert] Invalid Razorpay webhook signature received.");
      return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 400 });
    }

    // 3. Parse JSON event after signature verification
    const event = JSON.parse(rawBody);
    const eventType = event.event;
    console.log(`[Razorpay Webhook] Received verified event: "${eventType}"`);

    // 4. Resolve Order from Event payload
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    // Search order by priority: notes.starpressOrderId -> razorpayOrderId -> receipt (orderNumber)
    const starpressOrderId =
      paymentEntity?.notes?.starpressOrderId ||
      orderEntity?.notes?.starpressOrderId ||
      paymentEntity?.notes?.orderId;

    const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
    const receipt = paymentEntity?.receipt || orderEntity?.receipt;

    let targetOrder = null;
    if (starpressOrderId) {
      targetOrder = await getOrderById(starpressOrderId);
    }
    if (!targetOrder && rzpOrderId) {
      targetOrder = await db.order.findFirst({
        where: { razorpayOrderId: rzpOrderId },
        include: { items: true },
      });
    }
    if (!targetOrder && receipt) {
      targetOrder = await getOrderById(receipt);
    }

    if (!targetOrder) {
      console.warn(`[Razorpay Webhook] Order could not be resolved for event "${eventType}". Receipt: ${receipt}, RzpOrder: ${rzpOrderId}`);
      // Return 200 to acknowledge unhandled event without causing infinite webhook retries
      return NextResponse.json({ status: "acknowledged_unmatched" }, { status: 200 });
    }

    // 5. Handle Event Types
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentId = paymentEntity?.id;
      const amountInPaise = Number(paymentEntity?.amount || 0);
      const expectedPaise = Math.round(Number(targetOrder.totalAmount) * 100);

      // Amount verification: prevent undercharging attacks
      if (amountInPaise !== expectedPaise) {
        console.error(
          `[Webhook Security Alert] Amount mismatch on Order ${targetOrder.orderNumber}! Captured: ${amountInPaise} paise, Expected: ${expectedPaise} paise.`
        );

        // Mark as DISPUTED in database for admin investigation
        try {
          await db.order.update({
            where: { id: targetOrder.id },
            data: {
              paymentStatus: "DISPUTED",
              notes: `${targetOrder.notes || ""} [PAYMENT_DISPUTE: Captured ${amountInPaise} paise vs Expected ${expectedPaise} paise]`,
            },
          });
        } catch {}

        // Return 200 after logging and flagging to prevent retry storm
        return NextResponse.json({ status: "disputed_logged" }, { status: 200 });
      }

      if (paymentId) {
        await recordPaymentSuccess({
          orderId: targetOrder.id,
          paymentId,
          razorpayOrderId: rzpOrderId,
          signature,
          method: paymentEntity?.method || "ONLINE",
          amount: Number(targetOrder.totalAmount),
          rawPayload: event,
        });
      }
    } else if (eventType === "payment.failed") {
      const paymentId = paymentEntity?.id;
      const errorDesc =
        paymentEntity?.error_description ||
        paymentEntity?.error_reason ||
        "Payment failed at bank / card network";

      console.warn(`[Razorpay Webhook] Payment failed for Order ${targetOrder.orderNumber}: ${errorDesc}`);

      await recordPaymentFailure({
        orderId: targetOrder.id,
        paymentId,
        reason: errorDesc,
        rawPayload: event,
      });
    }

    // Always respond with 200 after processing
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("API /api/payments/razorpay/webhook error:", error);
    // Return 500 only for unexpected runtime crashes so Razorpay knows to retry
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
