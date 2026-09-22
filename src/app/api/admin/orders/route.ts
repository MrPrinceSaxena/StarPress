import { NextRequest, NextResponse } from "next/server";
import { listOrders } from "@/server/orders";
import { OrderStatus } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    // 3. Process authorized admin request
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
