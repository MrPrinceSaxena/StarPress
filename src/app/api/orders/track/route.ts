import { NextRequest, NextResponse } from "next/server";
import { trackOrder } from "@/server/orders";

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, phoneOrEmail } = await request.json();

    if (!orderNumber || !phoneOrEmail) {
      return NextResponse.json(
        { error: "Both Order Number and Phone/Email are required to track an order." },
        { status: 400 }
      );
    }

    const order = await trackOrder(orderNumber, phoneOrEmail);

    if (!order) {
      return NextResponse.json(
        { error: "No matching order found for this order number and contact information." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber,
        courierPartner: order.courierPartner,
        createdAt: order.createdAt,
        items: (order.items || []).map((i: any) => ({
          productName: i.productName,
          quantity: i.quantity,
          lineTotal: i.lineTotal,
        })),
      },
    });
  } catch (error) {
    console.error("API /api/orders/track error:", error);
    return NextResponse.json(
      { error: "Failed to query order tracking status." },
      { status: 500 }
    );
  }
}
