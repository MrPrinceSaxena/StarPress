import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/server/payments";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    // Require authenticated user
    let user;
    try {
      user = await getSessionUser();
    } catch {}

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to initiate payment." },
        { status: 401 }
      );
    }

    const razorpayOrder = await createRazorpayOrder({
      orderId,
      sessionUserId: user.id,
      sessionUserEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.razorpayOrderId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: razorpayOrder.keyId,
      orderNumber: razorpayOrder.orderNumber,
      isMock: razorpayOrder.isMock || false,
    });
  } catch (error: any) {
    console.error("API /api/payments/razorpay/create-order error:", error);
    const status = error.statusCode || 500;
    return NextResponse.json(
      { error: error.message || "Failed to initialize payment gateway order." },
      { status }
    );
  }
}
