import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { db } from "@/lib/db";
import { persistentStore } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let orders: any[] = [];
    try {
      orders = await db.order.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch {
      orders = persistentStore.getOrders();
    }

    let totalRevenue = 0;
    let netSales = 0;
    let totalTax = 0;
    let totalRefunds = 0;

    const transactions: any[] = [];

    for (const o of orders) {
      const amount = Number(o.totalAmount || 0);
      const isCancelled = (o.status || "").toUpperCase() === "CANCELLED";
      const isRefunded = (o.paymentStatus || "").toUpperCase() === "REFUNDED";

      if (isRefunded) {
        totalRefunds += amount;
      } else if (!isCancelled) {
        totalRevenue += amount;
        netSales += Number(o.subtotal || amount);
        totalTax += Number(o.gstAmount || 0);
      }

      transactions.push({
        id: `txn_${o.id}`,
        date: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
        type: isRefunded ? "refund" : "sale",
        description: `Order ${o.orderNumber} — ${o.guestName || "Customer"}`,
        amount: isRefunded ? -amount : amount,
        status: o.paymentStatus === "PAID" || o.paymentStatus === "paid" ? "completed" : "pending",
        reference: o.orderNumber,
      });
    }

    const summary = {
      totalRevenue,
      netSales,
      totalRefunds,
      totalTax,
      totalPayouts: Math.max(0, Math.round(totalRevenue * 0.85)),
      pendingPayouts: Math.max(0, Math.round(totalRevenue * 0.15)),
    };

    return NextResponse.json({
      success: true,
      summary,
      transactions,
    });
  } catch (error) {
    console.error("API /api/admin/finances error:", error);
    return NextResponse.json(
      { error: "Failed to calculate financial summary." },
      { status: 500 }
    );
  }
}
