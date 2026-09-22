import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  getAdminProductById,
  updateAdminProduct,
  deleteAdminProduct,
} from "@/server/products";

interface RouteParams {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/products/[id]
 * Retrieve single product details.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const product = await getAdminProductById(params.id);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error(`API /api/admin/products/${params.id} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch product details." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/products/[id]
 * Update product fields.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const ipAddress = request.headers.get("x-forwarded-for") || undefined;
    const result = await updateAdminProduct(
      params.id,
      body,
      user.email || "admin@starpress.in",
      ipAddress
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`API /api/admin/products/${params.id} PATCH error:`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to update product." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Delete product.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const ipAddress = request.headers.get("x-forwarded-for") || undefined;
    const result = await deleteAdminProduct(
      params.id,
      user.email || "admin@starpress.in",
      ipAddress
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`API /api/admin/products/${params.id} DELETE error:`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete product." },
      { status: 500 }
    );
  }
}
