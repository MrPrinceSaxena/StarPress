import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
      const slides = Array.isArray(dbSetting.value)
        ? dbSetting.value
        : typeof dbSetting.value === "string"
        ? JSON.parse(dbSetting.value)
        : [];
      return NextResponse.json({ success: true, slides });
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

    // Clean and validate slides before saving
    const sanitizedSlides = body.slides.map((s: any, idx: number) => ({
      src: String(s.src || "").trim(),
      alt: String(s.alt || `Star Press Slide ${idx + 1}`).trim(),
      badge: String(s.badge || "Featured").trim(),
      headline: Array.isArray(s.headline)
        ? s.headline.map((h: any) => String(h || "").trim())
        : [String(s.headline || "PREMIUM").trim(), "PRINTING"],
      highlightIndex: typeof s.highlightIndex === "number" ? s.highlightIndex : 1,
      sub: String(s.sub || "High quality commercial printing for your brand.").trim(),
      cta: {
        label: String(s.cta?.label || "Explore Shop").trim(),
        href: String(s.cta?.href || "/shop").trim(),
      },
    }));

    const saved = await db.storeSetting.upsert({
      where: { key: "HERO_SLIDER" },
      update: { value: sanitizedSlides },
      create: { key: "HERO_SLIDER", value: sanitizedSlides },
    });

    // Instantly purge ISR / Edge cache for the live store homepage
    try {
      revalidatePath("/");
      revalidatePath("/admin/settings");
    } catch (revalidateErr) {
      console.warn("revalidatePath notice:", revalidateErr);
    }

    return NextResponse.json({ success: true, slides: saved.value });
  } catch (error) {
    console.error("API /api/admin/settings/slider POST error:", error);
    return NextResponse.json(
      { error: "Failed to save slider settings." },
      { status: 500 }
    );
  }
}
