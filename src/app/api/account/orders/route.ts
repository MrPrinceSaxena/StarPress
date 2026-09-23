import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { persistentStore } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = (await getSessionUser()) || (await getServerSession(authOptions))?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const email = (user.email || "").toLowerCase().trim();
    let dbOrders: any[] = [];

    try {
      const userWhere: any[] = [{ userId: user.id }];
      if (email) {
        userWhere.push({ guestEmail: email });
      }

      dbOrders = await (db.order as any).findMany({
        where: {
          OR: userWhere,
        },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      });
    } catch (dbErr) {
      // Database query failed
    }

    // Merge persistent store orders
    let localOrders: any[] = [];
    try {
      localOrders = persistentStore.getOrders().filter(
        (o) =>
          o.userId === user.id ||
          (email && o.guestEmail?.toLowerCase().trim() === email)
      );
    } catch {}

    const combined = [...dbOrders];
    for (const lo of localOrders) {
      const exists = combined.some(
        (co) =>
          (co.id && lo.id && co.id === lo.id) ||
          (co.orderNumber && lo.orderNumber && co.orderNumber === lo.orderNumber)
      );
      if (!exists) {
        combined.push(lo);
      }
    }

    combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ success: true, orders: combined });
  } catch (error) {
    console.error("API /api/account/orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
