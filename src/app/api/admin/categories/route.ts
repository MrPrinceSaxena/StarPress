import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { listAdminCategories } from "@/server/products";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/categories
 * Retrieve all product categories for admin assignment.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const categories = await listAdminCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("API /api/admin/categories GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories." },
      { status: 500 }
    );
  }
}
