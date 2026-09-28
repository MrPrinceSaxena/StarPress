// =============================================================================
// GET & POST /api/admin/discounts
// Manage promotional coupons & discounts in StarPress
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/discounts
 * List all discount codes
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const discounts = await db.discount.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formatted = discounts.map((d) => ({
      id: d.id,
      code: d.code,
      type: d.type as "percentage" | "fixed",
      value: Number(d.value),
      usageCount: d.usedCount,
      usageLimit: d.maxUses || null,
      minOrderAmount: d.minOrderAmount ? Number(d.minOrderAmount) : null,
      startDate: d.startsAt.toISOString(),
      endDate: d.expiresAt ? d.expiresAt.toISOString() : null,
      status: !d.isActive
        ? "disabled"
        : d.expiresAt && new Date(d.expiresAt) < new Date()
        ? "expired"
        : "active",
      applicableTo: d.applicableTo,
      productIds: d.productIds,
    }));

    return NextResponse.json({
      success: true,
      discounts: formatted,
    });
  } catch (error) {
    console.error("API /api/admin/discounts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discounts." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/discounts
 * Create a new discount code
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      code,
      type,
      value,
      minOrderAmount,
      usageLimit,
      startDate,
      endDate,
      isActive,
      applicableTo,
      productIds,
    } = body;

    if (!code?.trim()) {
      return NextResponse.json(
        { error: "Discount code is required." },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "");

    // Check duplicate code
    const existing = await db.discount.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Discount code "${normalizedCode}" already exists.` },
        { status: 409 }
      );
    }

    const created = await db.discount.create({
      data: {
        code: normalizedCode,
        type: type === "percentage" ? "percentage" : "fixed",
        value: Number(value) || 0,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxUses: usageLimit ? parseInt(usageLimit, 10) : null,
        startsAt: startDate ? new Date(startDate) : new Date(),
        expiresAt: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        applicableTo: applicableTo || "all",
        productIds: Array.isArray(productIds) ? productIds : [],
      },
    });

    return NextResponse.json({
      success: true,
      discount: {
        id: created.id,
        code: created.code,
        type: created.type,
        value: Number(created.value),
        usageCount: created.usedCount,
        usageLimit: created.maxUses,
        minOrderAmount: created.minOrderAmount ? Number(created.minOrderAmount) : null,
        startDate: created.startsAt.toISOString(),
        endDate: created.expiresAt ? created.expiresAt.toISOString() : null,
        status: created.isActive ? "active" : "disabled",
      },
    });
  } catch (error: any) {
    console.error("API /api/admin/discounts POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create discount." },
      { status: 500 }
    );
  }
}
