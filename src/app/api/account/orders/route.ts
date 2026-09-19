import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    try {
      const orders = await db.order.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { guestEmail: session.user.email || undefined },
          ],
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
