import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/server/orders";
import { OrderStatus } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/supabase/server";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authenticate user session with Supabase server client
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication session required." },
        { status: 401 }
      );
    }

    // 2. Cryptographically verify ADMIN role in app_metadata
    const isAdmin = user.app_metadata?.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Star Press administrative privileges required." },
        { status: 403 }
      );
    }

    // 3. Process authorized admin order status update
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
