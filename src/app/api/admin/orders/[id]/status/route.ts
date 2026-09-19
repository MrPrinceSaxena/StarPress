import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/server/orders";
import { OrderStatus } from "@prisma/client";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { status, trackingNumber, courierPartner } = await request.json();

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: "Valid OrderStatus is required." },
        { status: 400 }
      );
    }

    const result = await updateOrderStatus(params.id, status as OrderStatus, {
      trackingNumber,
      courierPartner,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update order status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
    });
  } catch (error) {
    console.error("API /api/admin/orders/[id]/status error:", error);
    return NextResponse.json(
      { error: "Failed to update order status." },
      { status: 500 }
    );
  }
}
