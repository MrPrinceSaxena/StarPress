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

    const dbSetting = await db.storeSetting.findUnique({
      where: { key: "HERO_SLIDER" },
    });
    
    if (dbSetting && dbSetting.value) {
      return NextResponse.json({ success: true, slides: dbSetting.value });
    }

    return NextResponse.json({ success: true, slides: [] });
  } catch (error) {
    console.error("API /api/admin/settings/slider GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve slider settings." },
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

    if (!Array.isArray(body.slides)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected an array of slides." },
        { status: 400 }
      );
    }

    const saved = await db.storeSetting.upsert({
      where: { key: "HERO_SLIDER" },
      update: { value: body.slides },
      create: { key: "HERO_SLIDER", value: body.slides },
    });

    return NextResponse.json({ success: true, slides: saved.value });
  } catch (error) {
    console.error("API /api/admin/settings/slider POST error:", error);
    return NextResponse.json(
      { error: "Failed to save slider settings." },
      { status: 500 }
    );
  }
}
