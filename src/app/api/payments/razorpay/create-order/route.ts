import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/server/payments";
import { getOrderById } from "@/server/orders";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const razorpayOrder = await createRazorpayOrder({
      orderId: order.id,
      amountInRupees: Number(order.totalAmount),
      notes: {
        orderNumber: order.orderNumber,
        customerName: order.guestName || "Customer",
      },
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.razorpayOrderId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: razorpayOrder.keyId,
      orderNumber: order.orderNumber,
      isMock: razorpayOrder.isMock,
    });
  } catch (error) {
    console.error("API /api/payments/razorpay/create-order error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to initialize payment gateway order." },
      { status: 500 }
    );
  }
}
