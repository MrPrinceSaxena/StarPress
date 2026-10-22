// =============================================================================
// POST /api/create-order
// Standard Razorpay Order Creation Endpoint
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getRazorpayCredentials } from "@/server/payments";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { keyId, keySecret } = getRazorpayCredentials();

    if (!keyId || !keySecret) {
      console.error("[Razorpay Error] API credentials are not configured on server.");
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    let amount = Number(body.amount);
    const currency = (body.currency || "INR").toUpperCase();
    const receipt = body.receipt || `rcpt_${Date.now()}`;

    // Validate minimum amount (100 paise = ₹1)
    if (!amount || isNaN(amount) || amount < 100) {
      return NextResponse.json(
        { error: "Invalid amount. Minimum amount is 100 paise (₹1)." },
        { status: 400 }
      );
    }

    // Initialize official Razorpay SDK
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const orderOptions = {
      amount: Math.round(amount),
      currency,
      receipt: String(receipt).slice(0, 40),
      notes: body.notes || {},
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: keyId,
    });
  } catch (error: any) {
    console.error("[Razorpay API] create-order error:", error);
    const statusCode =
      error.statusCode === 401 || error?.error?.description?.includes("Authentication")
        ? 401
        : error.statusCode || 500;
    return NextResponse.json(
      {
        error: error.message || error.description || "Failed to create Razorpay order.",
      },
      { status: statusCode }
    );
  }
}
