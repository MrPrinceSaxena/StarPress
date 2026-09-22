import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = (await getSessionUser()) || (await getServerSession(authOptions))?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    try {
      const userWhere: any[] = [{ userId: user.id }];
      if (user.email) {
        userWhere.push({ guestEmail: user.email });
      }

      const orders = await (db.order as any).findMany({
        where: {
          OR: userWhere,
        },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      });

      return NextResponse.json({ success: true, orders });
    } catch (dbErr) {
      return NextResponse.json({ success: true, orders: [] });
    }
  } catch (error) {
    console.error("API /api/account/orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
