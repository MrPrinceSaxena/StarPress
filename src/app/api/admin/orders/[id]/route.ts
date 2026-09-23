import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/server/orders";
import { verifyAdminAccess } from "@/lib/admin/auth-check";

interface RouteParams {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const order = await getOrderById(params.id);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(`API /api/admin/orders/${params.id} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to retrieve order." },
      { status: 500 }
    );
  }
}
