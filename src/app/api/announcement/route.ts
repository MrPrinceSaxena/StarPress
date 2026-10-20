import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

let cachedAnnouncement: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60s in-memory TTL

export async function GET() {
  const now = Date.now();
  if (cachedAnnouncement && now - cachedAnnouncement.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { success: true, announcement: cachedAnnouncement.data },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  }

  try {
    const setting = await db.storeSetting.findUnique({
      where: { key: "store_announcement" },
    });

    const data = (setting?.value as any) || {
      text: "⚡ Welcome to Star Press: Premier Commercial Printing & Custom Fabrication in Khatima!",
      isActive: true,
      color: "gold",
    };

    cachedAnnouncement = { data, timestamp: now };

    return NextResponse.json(
      {
        success: true,
        announcement: data,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    const fallbackData = {
      text: "⚡ Welcome to Star Press: Premier Commercial Printing & Custom Fabrication in Khatima!",
      isActive: true,
      color: "gold",
    };
    return NextResponse.json(
      {
        success: true,
        announcement: fallbackData,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  }
}
