import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { db } from "@/lib/db";
import { persistentStore } from "@/server/storage";

export const dynamic = "force-dynamic";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

    // Build last 6 months buckets
    const now = new Date();
    const monthsMap: Record<string, { revenue: number; orders: number }> = {};
    const monthsList: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${MONTH_NAMES[d.getMonth()]}`;
      monthsList.push(key);
      monthsMap[key] = { revenue: 0, orders: 0 };
    }

    // Aggregate monthly revenue and order counts
    const productSalesMap: Record<string, { revenue: number; orders: number }> = {};
    const categorySalesMap: Record<string, number> = {};

    for (const order of orders) {
      if ((order.status || "").toUpperCase() === "CANCELLED") continue;

      const orderDate = new Date(order.createdAt || Date.now());
      const monthKey = MONTH_NAMES[orderDate.getMonth()];
      if (monthsMap[monthKey]) {
        monthsMap[monthKey].revenue += Number(order.totalAmount || 0);
        monthsMap[monthKey].orders += 1;
      }

      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const prodName = item.productName || "Product";
        if (!productSalesMap[prodName]) {
          productSalesMap[prodName] = { revenue: 0, orders: 0 };
        }
        productSalesMap[prodName].revenue += Number(item.lineTotal || item.unitPrice * item.quantity);
        productSalesMap[prodName].orders += item.quantity || 1;

        const catName = "Print Product";
        categorySalesMap[catName] = (categorySalesMap[catName] || 0) + Number(item.lineTotal || item.unitPrice * item.quantity);
      }
    }

    const revenueByMonth = monthsList.map((m) => ({
      month: m,
      revenue: monthsMap[m]?.revenue || 0,
      orders: monthsMap[m]?.orders || 0,
    }));

    const topProducts = Object.entries(productSalesMap)
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const totalCatRevenue = Object.values(categorySalesMap).reduce((sum, v) => sum + v, 0) || 1;
    const topCategories = Object.entries(categorySalesMap)
      .map(([name, revenue]) => ({
        name,
        revenue,
        percentage: Math.round((revenue / totalCatRevenue) * 100),
      }))
      .slice(0, 5);

    const analytics = {
      revenueByMonth,
      topProducts,
      topCategories,
      customerGrowth: monthsList.map((m) => ({
        month: m,
        newCustomers: monthsMap[m]?.orders || 0,
        returning: 0,
      })),
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("API /api/admin/analytics error:", error);
    return NextResponse.json(
      { error: "Failed to calculate analytics." },
      { status: 500 }
    );
  }
}
