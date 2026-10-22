// =============================================================================
// POST /api/verify-payment
// Standard Razorpay Signature Verification Endpoint (HMAC-SHA256)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getRazorpayCredentials } from "@/server/payments";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { keySecret } = getRazorpayCredentials();

    if (!keySecret) {
      console.error("[Razorpay Error] RAZORPAY_KEY_SECRET is not configured on the server.");
      return NextResponse.json(
        { error: "RAZORPAY_KEY_SECRET is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const orderId = body.order_id || body.razorpay_order_id;
    const paymentId = body.payment_id || body.razorpay_payment_id;
    const signature = body.signature || body.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing required fields: order_id, payment_id, and signature are mandatory." },
        { status: 400 }
      );
    }

    // Strict defense: Reject mock or simulated values
    if (
      String(orderId).startsWith("order_mock_") ||
      String(paymentId).startsWith("pay_mock_") ||
      signature === "mock_signature" ||
      signature === "mock_test_signature"
    ) {
      return NextResponse.json(
        { success: false, error: "Mock payments are prohibited." },
        { status: 400 }
      );
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuf = Buffer.from(generatedSignature, "utf8");
    const actualBuf = Buffer.from(signature, "utf8");

    const isMatch =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);

    if (!isMatch) {
      console.warn(`[Razorpay Verification] Signature mismatch for order: ${orderId}`);
      return NextResponse.json(
        { success: false, error: "Payment verification failed: Invalid cryptographic signature." },
        { status: 400 }
      );
    }

    // If linked to an internal Star Press order, sync DB record
    let linkedOrderNumber: string | undefined;
    try {
      const { db } = await import("@/lib/db");
      const { recordPaymentSuccess } = await import("@/server/payments");

      const dbOrder = await db.order.findFirst({
        where: {
          OR: [
            ...(body.starpressOrderId ? [{ id: body.starpressOrderId }] : []),
            { razorpayOrderId: orderId },
          ],
        },
      });

      if (dbOrder) {
        linkedOrderNumber = dbOrder.orderNumber;
        if (dbOrder.paymentStatus !== "PAID") {
          await recordPaymentSuccess({
            orderId: dbOrder.id,
            paymentId,
            razorpayOrderId: orderId,
            signature,
            method: "ONLINE",
            amount: Number(dbOrder.totalAmount),
            rawPayload: { verifiedVia: "/api/verify-payment", at: new Date().toISOString() },
          });
        }
      }
    } catch (dbErr) {
      console.warn("[verify-payment] Internal order sync notice:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Payment signature verified successfully.",
      order_id: orderId,
      payment_id: paymentId,
      orderNumber: linkedOrderNumber,
    });
  } catch (error: any) {
    console.error("[Razorpay API] verify-payment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}
