import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { updateOrderStatus } from "@/server/orders";
import { persistentStore } from "@/server/storage";
import { rateLimitDistributed, rateLimitExceededResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    let user = (await getSessionUser()) || (await getServerSession(authOptions))?.user;

    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const { createServerClient } = await import("@supabase/ssr");
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder",
          { cookies: { getAll: () => [], setAll: () => {} } }
        );
        const { data } = await supabase.auth.getUser(token);
        if (data?.user) {
          user = {
            id: data.user.id,
            email: data.user.email || "",
            name: data.user.user_metadata?.name || "Customer",
            phone: data.user.phone || data.user.user_metadata?.phone || null,
            role: data.user.app_metadata?.role || "CUSTOMER",
            app_metadata: data.user.app_metadata || {},
            email_confirmed_at: data.user.email_confirmed_at,
          } as any;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const rl = await rateLimitDistributed(`order:cancel:${user.id}`, 5, 60);
    if (!rl.success) {
      return rateLimitExceededResponse(rl, "Too many cancellation requests. Please wait a moment.");
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const reason = (body?.reason || "Customer requested cancellation").trim();

    // Look up order in DB
    let order: any = null;
    try {
      order = await db.order.findFirst({
        where: {
          OR: [{ id: orderId }, { orderNumber: orderId }],
        },
      });
    } catch {}

    if (!order) {
      order = persistentStore.getOrderById(orderId);
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Verify ownership
    if (order.userId && order.userId !== user.id && (order.guestEmail || "").toLowerCase() !== (user.email || "").toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized to cancel this order." }, { status: 403 });
    }

    // Check cancellation eligibility
    const currentStatus = (order.status || "").toUpperCase();
    if (currentStatus === "CANCELLED") {
      return NextResponse.json({ success: true, message: "Order is already cancelled." });
    }

    if (currentStatus !== "PENDING" && currentStatus !== "CONFIRMED") {
      return NextResponse.json(
        {
          error:
            "This order is already in printing production or has been dispatched. Please contact our support team via WhatsApp for cancellation assistance.",
        },
        { status: 400 }
      );
    }

    // Execute cancellation with atomic inventory restock
    const result = await updateOrderStatus(order.id, "CANCELLED", {
      notes: `[Customer Cancellation] ${reason}`,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to cancel order." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully. Any allocated stock has been restored.",
      order: result.order,
    });
  } catch (error: any) {
    console.error("API /api/account/orders/[id]/cancel error:", error);
    return NextResponse.json({ error: error?.message || "Failed to cancel order." }, { status: 500 });
  }
}
