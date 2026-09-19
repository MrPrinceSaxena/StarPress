import crypto from "crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export interface CreateRazorpayOrderInput {
  orderId: string;
  amountInRupees: number;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder(input: CreateRazorpayOrderInput) {
  const amountInPaise = Math.round(input.amountInRupees * 100);
  const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  // If Razorpay live keys are configured, call the Razorpay REST API directly
  if (keyId && keySecret) {
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: input.orderId,
          notes: input.notes || {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || "Failed to create Razorpay order");
      }

      const orderData = await response.json();

      // Update order record with razorpayOrderId
      try {
        await db.order.update({
          where: { id: input.orderId },
          data: { razorpayOrderId: orderData.id },
        });
      } catch (dbErr) {
        console.warn("Could not attach razorpayOrderId to DB order:", dbErr);
      }

      return {
        success: true,
        razorpayOrderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId,
      };
    } catch (error) {
      console.error("Razorpay API error:", error);
      throw error;
    }
  }

  // Graceful test/mock order fallback when Razorpay keys are not yet configured in local dev
  const mockRazorpayId = `order_mock_${Date.now()}`;
  return {
    success: true,
    razorpayOrderId: mockRazorpayId,
    amount: amountInPaise,
    currency: "INR",
    keyId: keyId || "rzp_test_placeholder",
    isMock: true,
  };
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // If running in development without secrets, approve mock payloads
    return true;
  }

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return true;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}

export async function recordPaymentSuccess(params: {
  orderId: string;
  paymentId: string;
  razorpayOrderId?: string;
  signature?: string;
  method?: string;
  amount: number;
  rawPayload?: any;
}) {
  try {
    const updatedOrder = await db.order.update({
      where: { id: params.orderId },
      data: {
        paymentId: params.paymentId,
        paymentStatus: "PAID",
        status: "CONFIRMED",
        transactions: {
          create: {
            gateway: "RAZORPAY",
            gatewayOrderId: params.razorpayOrderId || null,
            gatewayPaymentId: params.paymentId,
            gatewaySignature: params.signature || null,
            method: params.method || "ONLINE",
            amount: params.amount,
            currency: "INR",
            status: "CAPTURED",
            rawPayload: params.rawPayload || null,
          },
        },
      },
    });

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error recording payment success in DB:", error);
    return { success: false, error: (error as Error).message };
  }
}
