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

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase().trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, products: [], orders: [], customers: [] });
    }

    // 1. Search Orders
    let allOrders: any[] = [];
    try {
      allOrders = await db.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { guestName: { contains: q, mode: "insensitive" } },
            { guestEmail: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
      });
    } catch {
      allOrders = persistentStore
        .getOrders()
        .filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            (o.guestName && o.guestName.toLowerCase().includes(q)) ||
            (o.guestEmail && o.guestEmail.toLowerCase().includes(q))
        )
        .slice(0, 5);
    }

    const orders = allOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      title: `${o.orderNumber} - ${o.guestName || "Customer"}`,
      subtitle: `₹${Number(o.totalAmount || 0).toLocaleString("en-IN")} • ${o.status}`,
      href: `/admin/orders?search=${encodeURIComponent(o.orderNumber)}`,
    }));

    // 2. Search Products
    let allProducts: any[] = [];
    try {
      allProducts = await db.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
      });
    } catch {
      allProducts = [];
    }

    if (allProducts.length === 0) {
      allProducts = getAllProducts()
        .filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
        .slice(0, 5);
    }

    const products = allProducts.map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: `₹${Number(p.basePrice || 0).toLocaleString("en-IN")}`,
      href: `/admin/products/${p.id}`,
    }));

    // 3. Search Customers
    let allUsers: any[] = [];
    try {
      allUsers = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
      });
    } catch {
      allUsers = [];
    }

    const customers = allUsers.map((u) => ({
      id: u.id,
      title: u.name,
      subtitle: u.email,
      href: `/admin/customers?search=${encodeURIComponent(u.email)}`,
    }));

    return NextResponse.json({
      success: true,
      orders,
      products,
      customers,
    });
  } catch (error) {
    console.error("API /api/admin/search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search." },
      { status: 500 }
    );
  }
}
