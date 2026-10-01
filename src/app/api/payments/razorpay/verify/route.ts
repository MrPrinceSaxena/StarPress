// =============================================================================
// POST /api/payments/razorpay/verify
// Verifies Razorpay client checkout payload (HMAC + REST verification) — Phase A4
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  verifyRazorpaySignature,
  recordPaymentSuccess,
  isProductionEnvironment,
} from "@/server/payments";
import { getOrderById } from "@/server/orders";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { error: "orderId, razorpay_order_id, and razorpay_payment_id are mandatory." },
        { status: 400 }
      );
    }

    // 1. Resolve order from database
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const expectedPaise = Math.round(Number(order.totalAmount) * 100);
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
    const isProd = isProductionEnvironment();

    // 2. Dev Mock verification (strictly prohibited in production)
    const isMock = razorpay_order_id.startsWith("order_mock_");
    if (isMock) {
      if (isProd) {
        return NextResponse.json(
          { error: "Mock payments are prohibited in production." },
          { status: 403 }
        );
      }

      const recorded = await recordPaymentSuccess({
        orderId: order.id,
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        signature: razorpay_signature || "mock_signature",
        method: "DEV_TEST",
        amount: Number(order.totalAmount),
        rawPayload: { mock: true, verifiedAt: new Date().toISOString() },
      });

      return NextResponse.json({
        success: true,
        orderNumber: order.orderNumber,
        paymentStatus: "PAID",
        isMock: true,
      });
    }

    // 3. Cryptographic HMAC verification
    if (!razorpay_signature) {
      return NextResponse.json(
        { error: "razorpay_signature is required for online verification." },
        { status: 400 }
      );
    }

    const isValidHmac = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidHmac) {
      console.warn(`[Payment Security] Invalid HMAC signature for Order ${order.orderNumber}`);
      return NextResponse.json(
        { error: "Cryptographic signature mismatch. Payment verification failed." },
        { status: 400 }
      );
    }

    // 4. Authoritative Gateway REST verification: GET https://api.razorpay.com/v1/payments/:id
    let capturedMethod = "ONLINE";
    if (keyId && keySecret) {
      try {
        const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const rzpRes = await fetch(
          `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
          {
            headers: {
              Authorization: `Basic ${basicAuth}`,
            },
          }
        );

        if (!rzpRes.ok) {
          console.error(`[Razorpay REST] Payment lookup failed: ${rzpRes.status}`);
          return NextResponse.json(
            { error: "Could not verify payment with gateway authority." },
            { status: 502 }
          );
        }

        const paymentData = await rzpRes.json();

        // Validate payment status
        if (paymentData.status !== "captured" && paymentData.status !== "authorized") {
          console.warn(`[Razorpay Verify] Unexpected status "${paymentData.status}" for ${razorpay_payment_id}`);
          return NextResponse.json(
            { error: `Payment is not in captured status (current: ${paymentData.status}).` },
            { status: 400 }
          );
        }

        // Validate amount charged against DB total
        if (paymentData.amount !== expectedPaise) {
          console.error(
            `[Payment Security Alert] Amount mismatch! Gateway charged ${paymentData.amount} paise, DB expected ${expectedPaise} paise.`
          );
          return NextResponse.json(
            { error: "Payment amount does not match order total." },
            { status: 400 }
          );
        }

        // Validate order_id match
        if (paymentData.order_id && paymentData.order_id !== razorpay_order_id) {
          console.error(
            `[Payment Security Alert] Order ID mismatch! Gateway: ${paymentData.order_id}, client: ${razorpay_order_id}`
          );
          return NextResponse.json(
            { error: "Gateway order ID mismatch." },
            { status: 400 }
          );
        }

        capturedMethod = paymentData.method || "ONLINE";
      } catch (restErr: any) {
        console.error("[Razorpay REST Verification Error]:", restErr);
        if (isProd) {
          return NextResponse.json(
            { error: "Failed to communicate with Razorpay verification API." },
            { status: 502 }
          );
        }
      }
    }

    // 5. Authoritatively record payment success in DB
    const result = await recordPaymentSuccess({
      orderId: order.id,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      signature: razorpay_signature,
      method: capturedMethod,
      amount: Number(order.totalAmount),
      rawPayload: { verifiedVia: "api_verify", at: new Date().toISOString() },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update order payment record." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      paymentStatus: "PAID",
    });
  } catch (error: any) {
    console.error("API /api/payments/razorpay/verify error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal error during payment verification." },
      { status: 500 }
    );
  }
}
