import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, recordPaymentSuccess } from "@/server/payments";
import { getOrderById } from "@/server/orders";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "order.paid" || event.event === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.notes?.orderId || paymentEntity?.receipt;
      const paymentId = paymentEntity?.id;
      const razorpayOrderId = paymentEntity?.order_id;
      const amountInRupees = (paymentEntity?.amount || 0) / 100;
      const method = paymentEntity?.method;

      if (orderId && paymentId) {
        const order = await getOrderById(orderId);
        if (order) {
          await recordPaymentSuccess({
            orderId: order.id,
            paymentId,
            razorpayOrderId,
            method,
            amount: amountInRupees,
            rawPayload: event,
          });
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("API /api/payments/razorpay/webhook error:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
