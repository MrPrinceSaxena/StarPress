import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const setting = await db.storeSetting.findUnique({
      where: { key: "marketing_campaigns" },
    });

    const campaigns = (setting?.value as any[]) || [];

    return NextResponse.json({
      success: true,
      campaigns,
    });
  } catch (error: any) {
    console.error("API /api/admin/marketing/campaigns GET error:", error);
    return NextResponse.json(
      { error: "Failed to load marketing campaigns." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { name, type, budget, reach, startDate, endDate } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Campaign name is required." }, { status: 400 });
    }

    const setting = await db.storeSetting.findUnique({
      where: { key: "marketing_campaigns" },
    });

    const existingCampaigns = (setting?.value as any[]) || [];

    const newCampaign = {
      id: `camp_${Date.now()}`,
      name: name.trim(),
      type: type || "social",
      status: "active",
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || null,
      budget: Number(budget) || 0,
      reach: Number(reach) || 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [newCampaign, ...existingCampaigns];

    await db.storeSetting.upsert({
      where: { key: "marketing_campaigns" },
      create: {
        key: "marketing_campaigns",
        value: updated,
      },
      update: {
        value: updated,
      },
    });

    return NextResponse.json({
      success: true,
      campaign: newCampaign,
    });
  } catch (error: any) {
    console.error("API /api/admin/marketing/campaigns POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create campaign." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id, status } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required." }, { status: 400 });
    }

    const setting = await db.storeSetting.findUnique({
      where: { key: "marketing_campaigns" },
    });

    const existingCampaigns = (setting?.value as any[]) || [];
    let updatedCampaign: any = null;

    const updated = existingCampaigns.map((c) => {
      if (c.id === id) {
        updatedCampaign = { ...c, status: status || (c.status === "active" ? "paused" : "active") };
        return updatedCampaign;
      }
      return c;
    });

    await db.storeSetting.upsert({
      where: { key: "marketing_campaigns" },
      create: {
        key: "marketing_campaigns",
        value: updated,
      },
      update: {
        value: updated,
      },
    });

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
    });
  } catch (error: any) {
    console.error("API /api/admin/marketing/campaigns PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update campaign." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required." }, { status: 400 });
    }

    const setting = await db.storeSetting.findUnique({
      where: { key: "marketing_campaigns" },
    });

    const existingCampaigns = (setting?.value as any[]) || [];
    const filtered = existingCampaigns.filter((c) => c.id !== id);

    await db.storeSetting.upsert({
      where: { key: "marketing_campaigns" },
      create: {
        key: "marketing_campaigns",
        value: filtered,
      },
      update: {
        value: filtered,
      },
    });

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error: any) {
    console.error("API /api/admin/marketing/campaigns DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign." },
      { status: 500 }
    );
  }
}
