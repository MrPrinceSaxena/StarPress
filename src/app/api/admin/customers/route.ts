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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // 1. Fetch real orders (from Prisma or persistentStore)
    let orders: any[] = [];
    try {
      orders = await db.order.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch {
      orders = persistentStore.getOrders();
    }

    // 2. Fetch registered users
    let users: any[] = [];
    try {
      users = await db.user.findMany({
        where: { role: "CUSTOMER" },
        include: { addresses: true },
      });
    } catch {
      users = [];
    }

    // 3. Build customer aggregation map by email
    const customerMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      phone: string;
      totalOrders: number;
      totalSpent: number;
      lastOrderDate: string | null;
      status: "active" | "inactive";
      createdAt: string;
      address: string;
      avatar: string | null;
    }>();

    // Add registered users first
    for (const u of users) {
      const defaultAddr = u.addresses?.find((a: any) => a.isDefault) || u.addresses?.[0];
      const addrStr = defaultAddr
        ? [defaultAddr.line1, defaultAddr.city, defaultAddr.state, defaultAddr.pincode].filter(Boolean).join(", ")
        : "";
      customerMap.set(u.email.toLowerCase(), {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "",
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: null,
        status: "active",
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        address: addrStr,
        avatar: null,
      });
    }

    // Aggregate orders
    for (const o of orders) {
      const email = (o.guestEmail || o.user?.email || "").toLowerCase().trim();
      if (!email) continue;

      let entry = customerMap.get(email);
      let addrStr = "";
      if (typeof o.shippingAddress === "string") {
        addrStr = o.shippingAddress;
      } else if (o.shippingAddress) {
        const a = o.shippingAddress;
        addrStr = [a.addressLine1 || a.line1, a.city, a.state, a.pincode].filter(Boolean).join(", ");
      }

      const orderTotal = Number(o.totalAmount || 0);
      const orderDate = o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString();

      if (!entry) {
        entry = {
          id: `cust_${Buffer.from(email).toString("hex").substring(0, 8)}`,
          name: o.guestName || "Customer",
          email,
          phone: o.guestPhone || "",
          totalOrders: 1,
          totalSpent: orderTotal,
          lastOrderDate: orderDate,
          status: "active",
          createdAt: orderDate,
          address: addrStr,
          avatar: null,
        };
        customerMap.set(email, entry);
      } else {
        entry.totalOrders += 1;
        entry.totalSpent += orderTotal;
        if (!entry.lastOrderDate || new Date(orderDate) > new Date(entry.lastOrderDate)) {
          entry.lastOrderDate = orderDate;
        }
        if (!entry.phone && o.guestPhone) entry.phone = o.guestPhone;
        if (!entry.address && addrStr) entry.address = addrStr;
      }
    }

    let customers = Array.from(customerMap.values());

    // Apply search filter
    if (search) {
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone.includes(search)
      );
    }

    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    const total = customers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const paged = customers.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      customers: paged,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    console.error("API /api/admin/customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers." },
      { status: 500 }
    );
  }
}
