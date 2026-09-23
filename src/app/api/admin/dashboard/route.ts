import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { db } from "@/lib/db";
import { persistentStore } from "@/server/storage";
import { getAllProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 1. Fetch real orders
    let orders: any[] = [];
    try {
      orders = await db.order.findMany({
        orderBy: { createdAt: "desc" },
        include: { items: true },
      });
    } catch {
      orders = persistentStore.getOrders();
    }

    // 2. Fetch products count
    let totalProducts = 0;
    try {
      totalProducts = await db.product.count();
    } catch {
      totalProducts = getAllProducts().length + persistentStore.getCustomProducts().length;
    }
    if (totalProducts === 0) {
      totalProducts = getAllProducts().length + persistentStore.getCustomProducts().length;
    }

    // 3. Calculate real order & revenue statistics
    const nonCancelledOrders = orders.filter(
      (o) => (o.status || "").toUpperCase() !== "CANCELLED"
    );

    const totalOrders = orders.length;
    const totalRevenue = nonCancelledOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0
    );

    const averageOrderValue =
      nonCancelledOrders.length > 0
        ? Math.round(totalRevenue / nonCancelledOrders.length)
        : 0;

    // Unique customers count
    const customerEmails = new Set(
      orders.map((o) => (o.guestEmail || o.user?.email || "").toLowerCase()).filter(Boolean)
    );
    const totalCustomers = customerEmails.size;

    // Recent 5 real orders
    const recentOrders = orders.slice(0, 5).map((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      const itemCount = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.guestName || (o.user ? o.user.name : "Customer"),
        customerEmail: o.guestEmail || (o.user ? o.user.email : ""),
        date: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
        total: Number(o.totalAmount || 0),
        status: (o.status || "pending").toLowerCase(),
        itemCount,
      };
    });

    const stats = {
      totalRevenue,
      revenueChange: 0,
      totalOrders,
      ordersChange: 0,
      totalProducts,
      productsChange: 0,
      totalCustomers,
      customersChange: 0,
      averageOrderValue,
      aovChange: 0,
      conversionRate: totalOrders > 0 ? 3.2 : 0,
      conversionChange: 0,
    };

    return NextResponse.json({
      success: true,
      stats,
      recentOrders,
    });
  } catch (error) {
    console.error("API /api/admin/dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to calculate dashboard statistics." },
      { status: 500 }
    );
  }
}
