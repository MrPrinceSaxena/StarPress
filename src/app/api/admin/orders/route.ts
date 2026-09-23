import { NextRequest, NextResponse } from "next/server";
import { listOrders } from "@/server/orders";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { persistentStore } from "@/server/storage";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusParam = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const result = await listOrders({
      status: statusParam === "all" ? undefined : statusParam,
      search: search || undefined,
      limit,
      skip,
    });

    // Compute dynamic status counts from all orders
    let allOrders: any[] = [];
    try {
      allOrders = await db.order.findMany({ select: { status: true } });
    } catch {
      allOrders = persistentStore.getOrders();
    }

    const stats = {
      total: allOrders.length,
      pending: allOrders.filter((o) => o.status.toLowerCase() === "pending").length,
      processing: allOrders.filter((o) => o.status.toLowerCase() === "processing" || o.status.toLowerCase() === "confirmed" || o.status.toLowerCase() === "in_production").length,
      shipped: allOrders.filter((o) => o.status.toLowerCase() === "shipped" || o.status.toLowerCase() === "dispatched").length,
      delivered: allOrders.filter((o) => o.status.toLowerCase() === "delivered").length,
      cancelled: allOrders.filter((o) => o.status.toLowerCase() === "cancelled").length,
      refunded: allOrders.filter((o) => o.status.toLowerCase() === "refunded").length,
    };

    // Format orders for Admin UI
    const formattedOrders = result.orders.map((o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      const itemCount = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
      const subtotal = Number(o.subtotal || 0);
      const tax = Number(o.gstAmount || 0);
      const shipping = Number(o.shippingFee || 0);
      const discount = Number(o.discountAmount || 0);
      const total = Number(o.totalAmount || 0);

      // Extract shipping address display
      let shippingAddrStr = "";
      if (typeof o.shippingAddress === "string") {
        shippingAddrStr = o.shippingAddress;
      } else if (o.shippingAddress) {
        const a = o.shippingAddress;
        shippingAddrStr = [a.addressLine1 || a.line1, a.addressLine2 || a.line2, a.city, a.state, a.pincode]
          .filter(Boolean)
          .join(", ");
      }

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.guestName || (o.user ? o.user.name : "Customer"),
        customerEmail: o.guestEmail || (o.user ? o.user.email : ""),
        customerPhone: o.guestPhone || (o.user ? o.user.phone : ""),
        date: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
        items: items.map((it: any) => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          sku: it.productSlug ? `SP-${it.productSlug.substring(0, 8).toUpperCase()}` : "SP-ITEM",
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
          total: Number(it.lineTotal || it.unitPrice * it.quantity),
          image: it.previewUrl || it.artworkUrl || "",
        })),
        itemCount,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        paymentStatus: (o.paymentStatus || "unpaid").toLowerCase(),
        fulfillmentStatus: (o.status === "DELIVERED" || o.status === "DISPATCHED" ? "fulfilled" : o.status === "IN_PRODUCTION" ? "partial" : "unfulfilled"),
        status: o.status.toLowerCase(),
        shippingAddress: shippingAddrStr,
        trackingNumber: o.trackingNumber || null,
        courierPartner: o.courierPartner || null,
        notes: o.notes || null,
      };
    });

    const totalPages = Math.ceil(result.total / limit) || 1;

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      total: result.total,
      totalPages,
      page,
      limit,
      stats,
    });
  } catch (error) {
    console.error("API /api/admin/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
