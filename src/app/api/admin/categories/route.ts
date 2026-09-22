import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { listAdminCategories } from "@/server/products";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/categories
 * Retrieve all product categories for admin assignment.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication session required." },
        { status: 401 }
      );
    }

    const isAdmin = user.app_metadata?.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Star Press administrative privileges required." },
        { status: 403 }
      );
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
