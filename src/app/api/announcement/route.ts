import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
  } catch (error) {
    return NextResponse.json({
      success: true,
      announcement: {
        text: "⚡ Welcome to Star Press: Premier Commercial Printing & Custom Fabrication in Khatima!",
        isActive: true,
        color: "gold",
      },
    });
  }
}
