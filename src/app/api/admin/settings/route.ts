import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { persistentStore } from "@/server/storage";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Try PostgreSQL db.storeSetting first
    try {
      const dbSetting = await db.storeSetting.findUnique({
        where: { key: "general_settings" },
      });
      if (dbSetting && dbSetting.value) {
        return NextResponse.json({ success: true, settings: dbSetting.value });
      }
    } catch {}

    const settings = persistentStore.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("API /api/admin/settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve settings." },
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

    // Persist to PostgreSQL db.storeSetting
    try {
      await db.storeSetting.upsert({
        where: { key: "general_settings" },
        update: { value: body },
        create: { key: "general_settings", value: body },
      });
    } catch (dbErr) {
      console.warn("Could not save to db.storeSetting, falling back:", dbErr);
    }

    const updated = persistentStore.saveSettings(body);

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("API /api/admin/settings POST error:", error);
    return NextResponse.json(
      { error: "Failed to save settings." },
      { status: 500 }
    );
  }
}
