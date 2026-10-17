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
      where: { key: "store_announcement" },
    });

    const data = (setting?.value as any) || {
      text: "⚡ Welcome to Star Press: Premier Commercial Printing & Custom Fabrication in Khatima!",
      isActive: true,
      color: "gold",
    };

    return NextResponse.json({
      success: true,
      announcement: data,
    });
  } catch (error: any) {
    console.error("API /api/admin/marketing/announcement GET error:", error);
    return NextResponse.json(
      { error: "Failed to load announcement." },
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
    const { text, isActive, color } = body;

    const payload = {
      text: String(text || "").trim(),
      isActive: Boolean(isActive),
      color: color || "gold",
      updatedAt: new Date().toISOString(),
    };

    await db.storeSetting.upsert({
      where: { key: "store_announcement" },
      create: {
        key: "store_announcement",
        value: payload,
      },
      update: {
        value: payload,
      },
    });

    return NextResponse.json({
      success: true,
      announcement: payload,
    });
  } catch (error: any) {
    console.error("API /api/admin/marketing/announcement POST error:", error);
    return NextResponse.json(
      { error: "Failed to save announcement." },
      { status: 500 }
    );
  }
}
