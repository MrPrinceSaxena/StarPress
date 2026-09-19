import { NextRequest, NextResponse } from "next/server";
import { listOrders } from "@/server/orders";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as OrderStatus | null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const result = await listOrders({
      status: statusParam || undefined,
      limit,
      skip,
    });

    return NextResponse.json({
      success: true,
      orders: result.orders,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error("API /api/admin/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
