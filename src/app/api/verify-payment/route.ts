import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET ||
      "bHLfw4FddkBAH2YxT4aUofK4";

    if (!keySecret) {
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

    // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
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
      console.warn(`[Razorpay Signature Verification] Signature mismatch for order: ${orderId}`);
      return NextResponse.json(
        { success: false, error: "Payment verification failed: Invalid cryptographic signature." },
        { status: 400 }
      );
    }

    // Persist to database if linked to a Star Press order
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
      console.warn("[verify-payment] Database order record notice:", dbErr);
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
