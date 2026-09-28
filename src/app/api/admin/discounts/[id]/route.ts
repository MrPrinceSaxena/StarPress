// =============================================================================
// PATCH & DELETE /api/admin/discounts/[id]
// Update discount details, toggle status, or delete discount code
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { db } from "@/lib/db";

interface RouteParams {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.code !== undefined) updateData.code = body.code.trim().toUpperCase().replace(/\s+/g, "");
    if (body.type !== undefined) updateData.type = body.type;
    if (body.value !== undefined) updateData.value = Number(body.value);
    if (body.minOrderAmount !== undefined) updateData.minOrderAmount = body.minOrderAmount ? Number(body.minOrderAmount) : null;
    if (body.usageLimit !== undefined) updateData.maxUses = body.usageLimit ? parseInt(body.usageLimit, 10) : null;
    if (body.startDate !== undefined) updateData.startsAt = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.expiresAt = body.endDate ? new Date(body.endDate) : null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.status !== undefined) updateData.isActive = body.status === "active";

    const updated = await db.discount.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      discount: {
        id: updated.id,
        code: updated.code,
        type: updated.type,
        value: Number(updated.value),
        usageCount: updated.usedCount,
        usageLimit: updated.maxUses,
        minOrderAmount: updated.minOrderAmount ? Number(updated.minOrderAmount) : null,
        startDate: updated.startsAt.toISOString(),
        endDate: updated.expiresAt ? updated.expiresAt.toISOString() : null,
        status: !updated.isActive ? "disabled" : updated.expiresAt && new Date(updated.expiresAt) < new Date() ? "expired" : "active",
      },
    });
  } catch (error: any) {
    console.error(`API /api/admin/discounts/${params.id} PATCH error:`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to update discount." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await db.discount.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API /api/admin/discounts/${params.id} DELETE error:`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete discount." },
      { status: 500 }
    );
  }
}
