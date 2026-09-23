import { db } from "@/lib/db";
import { Prisma, OrderStatus } from "@prisma/client";
import { persistentStore, PersistedOrder } from "@/server/storage";

export interface CreateOrderItemInput {
  productId?: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specs?: Record<string, any>;
  customText?: string;
  artworkUrl?: string;
  previewUrl?: string;
}

export interface CreateOrderInput {
  userId?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestName?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    companyName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  billingAddress?: {
    companyName?: string;
    gstin?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  subtotal: number;
  gstAmount?: number;
  shippingFee?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod?: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `SP-${year}-${random}`;
}

export async function createOrder(input: CreateOrderInput) {
  const orderNumber = generateOrderNumber();

  // Try Prisma first
  try {
    let validUserId: string | null = null;
    if (input.userId) {
      try {
        const { ensureDbUser } = await import("@/lib/user-sync");
        const synced = await ensureDbUser({
          id: input.userId,
          email: input.guestEmail || input.shippingAddress.email,
          name: input.guestName || input.shippingAddress.fullName,
          phone: input.guestPhone || input.shippingAddress.phone,
        });
        if (synced) validUserId = synced.id;
      } catch {
        validUserId = null;
      }
    }

    const order = await (db.order as any).create({
      data: {
        orderNumber,
        userId: validUserId,
        guestEmail: input.guestEmail || input.shippingAddress.email,
        guestPhone: input.guestPhone || input.shippingAddress.phone,
        guestName: input.guestName || input.shippingAddress.fullName,
        status: OrderStatus.PENDING,
        subtotal: input.subtotal,
        gstAmount: input.gstAmount !== undefined ? input.gstAmount : null,
        shippingFee: input.shippingFee || 0,
        discountAmount: input.discountAmount || 0,
        totalAmount: input.totalAmount,
        shippingAddress: input.shippingAddress as unknown as Prisma.InputJsonValue,
        billingAddress: input.billingAddress ? (input.billingAddress as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        paymentMethod: input.paymentMethod || "MANUAL_PROOF",
        paymentStatus: "UNPAID",
        notes: input.notes || null,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId || null,
            productName: item.productName,
            productSlug: item.productSlug,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            specs: item.specs ? (item.specs as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
            customText: item.customText || null,
            artworkUrl: item.artworkUrl || null,
            previewUrl: item.previewUrl || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Also mirror to persistent store for high availability
    persistentStore.saveOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      guestEmail: order.guestEmail,
      guestPhone: order.guestPhone,
      guestName: order.guestName,
      status: order.status,
      subtotal: Number(order.subtotal),
      gstAmount: order.gstAmount ? Number(order.gstAmount) : null,
      shippingFee: Number(order.shippingFee || 0),
      discountAmount: Number(order.discountAmount || 0),
      totalAmount: Number(order.totalAmount),
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      paymentMethod: order.paymentMethod || "MANUAL_PROOF",
      paymentStatus: order.paymentStatus || "UNPAID",
      notes: order.notes,
      items: order.items.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        productSlug: i.productSlug,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
        specs: i.specs,
        customText: i.customText,
        artworkUrl: i.artworkUrl,
        previewUrl: i.previewUrl,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    });

    return { success: true, order };
  } catch (error) {
    console.warn("Database offline or unavailable, saving to persistent JSON store:", (error as any)?.message);

    // Save permanently to persistent file storage
    const newPersistedOrder: PersistedOrder = {
      id: `ord_${Date.now()}`,
      orderNumber,
      userId: input.userId || null,
      guestEmail: input.guestEmail || input.shippingAddress.email,
      guestPhone: input.guestPhone || input.shippingAddress.phone,
      guestName: input.guestName || input.shippingAddress.fullName,
      status: "PENDING",
      subtotal: input.subtotal,
      gstAmount: input.gstAmount !== undefined ? input.gstAmount : null,
      shippingFee: input.shippingFee || 0,
      discountAmount: input.discountAmount || 0,
      totalAmount: input.totalAmount,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress,
      paymentMethod: input.paymentMethod || "MANUAL_PROOF",
      paymentStatus: "UNPAID",
      notes: input.notes || null,
      items: input.items.map((item, idx) => ({
        id: `oi_${Date.now()}_${idx}`,
        productId: item.productId || null,
        productName: item.productName,
        productSlug: item.productSlug,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        specs: item.specs,
        customText: item.customText || null,
        artworkUrl: item.artworkUrl || null,
        previewUrl: item.previewUrl || null,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persistentStore.saveOrder(newPersistedOrder);
    return { success: true, order: newPersistedOrder, isFallback: true };
  }
}

export async function getOrderById(idOrNumber: string) {
  // 1. Try Prisma DB
  try {
    const order = await db.order.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
      },
      include: {
        items: true,
        transactions: true,
      },
    });
    if (order) return order;
  } catch (error) {
    // DB unreachable, check persistent store
  }

  // 2. Check persistent store
  return persistentStore.getOrderById(idOrNumber);
}

export async function trackOrder(orderNumber: string, phoneOrEmail: string) {
  const normalizedInput = phoneOrEmail.trim().toLowerCase();
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();

  try {
    const order = await (db.order as any).findFirst({
      where: {
        orderNumber: normalizedOrderNumber,
        OR: [
          { guestEmail: { equals: normalizedInput, mode: "insensitive" } },
          { guestPhone: { contains: normalizedInput } },
        ],
      },
      include: {
        items: true,
      },
    });
    if (order) return order;
  } catch (error) {
    // DB unreachable, check persistent store
  }

  const storedOrder = persistentStore.getOrderById(normalizedOrderNumber);
  if (storedOrder) {
    const matchesEmail = storedOrder.guestEmail?.toLowerCase() === normalizedInput;
    const matchesPhone = storedOrder.guestPhone?.includes(normalizedInput);
    if (matchesEmail || matchesPhone) {
      return storedOrder;
    }
  }

  return null;
}

export async function getOrderStats() {
  let allOrders: { id?: string; orderNumber?: string; status: string }[] = [];

  try {
    const dbOrders = await db.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
    });
    if (Array.isArray(dbOrders)) {
      allOrders = dbOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: String(o.status || "").toUpperCase(),
      }));
    }
  } catch (error) {
    // Database query failed or unavailable
  }

  // Merge from persistentStore
  try {
    const local = persistentStore.getOrders();
    for (const lo of local) {
      const exists = allOrders.some(
        (ao) =>
          (ao.id && lo.id && ao.id === lo.id) ||
          (ao.orderNumber && lo.orderNumber && ao.orderNumber.toUpperCase() === lo.orderNumber.toUpperCase())
      );
      if (!exists) {
        allOrders.push({
          id: lo.id,
          orderNumber: lo.orderNumber,
          status: String(lo.status || "").toUpperCase(),
        });
      }
    }
  } catch {}

  const norm = (s?: string) => {
    const v = (s || "").toUpperCase().trim();
    if (v === "DISPATCHED") return "SHIPPED";
    if (v === "CONFIRMED" || v === "IN_PRODUCTION") return "PROCESSING";
    return v;
  };

  const total = allOrders.length;
  const pending = allOrders.filter((o) => norm(o.status) === "PENDING").length;
  const processing = allOrders.filter((o) => norm(o.status) === "PROCESSING").length;
  const shipped = allOrders.filter((o) => norm(o.status) === "SHIPPED").length;
  const delivered = allOrders.filter((o) => norm(o.status) === "DELIVERED").length;
  const cancelled = allOrders.filter((o) => norm(o.status) === "CANCELLED").length;
  const refunded = allOrders.filter((o) => norm(o.status) === "REFUNDED").length;

  return {
    total,
    pending,
    processing,
    shipped,
    delivered,
    cancelled,
    refunded,
  };
}

export async function listOrders(options?: {
  status?: string;
  search?: string;
  limit?: number;
  skip?: number;
}) {
  let dbOrders: any[] = [];

  try {
    const where: any = {};
    if (options?.status && options.status !== "all" && options.status !== "ALL") {
      const st = options.status.toUpperCase();
      if (st === "SHIPPED") {
        where.status = { in: ["DISPATCHED", "SHIPPED"] as any };
      } else if (st === "PROCESSING") {
        where.status = { in: ["CONFIRMED", "IN_PRODUCTION", "PROCESSING"] as any };
      } else {
        where.status = st as any;
      }
    }
    if (options?.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { guestName: { contains: q, mode: "insensitive" } },
        { guestEmail: { contains: q, mode: "insensitive" } },
      ];
    }

    dbOrders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });
  } catch (error) {
    // Database query failed or unavailable
  }

  // Also query persistent storage
  let localOrders: any[] = [];
  try {
    localOrders = persistentStore.getOrders();
  } catch {}

  // Filter local orders
  if (options?.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    localOrders = localOrders.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.guestName?.toLowerCase().includes(q) ||
        o.guestEmail?.toLowerCase().includes(q)
    );
  }

  if (options?.status && options.status !== "all" && options.status !== "ALL") {
    const s = options.status.toUpperCase();
    localOrders = localOrders.filter((o) => {
      const st = (o.status || "").toUpperCase();
      if (s === "SHIPPED") return st === "SHIPPED" || st === "DISPATCHED";
      if (s === "PROCESSING") return st === "PROCESSING" || st === "CONFIRMED" || st === "IN_PRODUCTION";
      return st === s;
    });
  }

  // Deduplicate: merge dbOrders and localOrders
  const combinedOrders = [...dbOrders];
  for (const lo of localOrders) {
    const exists = combinedOrders.some(
      (co) =>
        (co.id && lo.id && co.id === lo.id) ||
        (co.orderNumber && lo.orderNumber && co.orderNumber.toUpperCase() === lo.orderNumber.toUpperCase())
    );
    if (!exists) {
      combinedOrders.push(lo);
    }
  }

  // Sort descending by date
  combinedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = combinedOrders.length;
  const skip = options?.skip || 0;
  const limit = options?.limit || 50;
  const paged = combinedOrders.slice(skip, skip + limit);

  return { orders: paged, total };
}

export async function updateOrderStatus(
  id: string,
  status: string,
  tracking?: { trackingNumber?: string; courierPartner?: string; notes?: string }
) {
  let normalizedStatus = status.toUpperCase();
  if (normalizedStatus === "SHIPPED") normalizedStatus = "DISPATCHED";
  if (normalizedStatus === "PROCESSING") normalizedStatus = "IN_PRODUCTION";

  // First try Prisma DB
  try {
    const updated = await db.order.update({
      where: { id },
      data: {
        status: normalizedStatus as OrderStatus,
        ...(tracking?.trackingNumber !== undefined ? { trackingNumber: tracking.trackingNumber } : {}),
        ...(tracking?.courierPartner !== undefined ? { courierPartner: tracking.courierPartner } : {}),
        ...(tracking?.notes !== undefined ? { notes: tracking.notes } : {}),
      },
      include: { items: true },
    });

    persistentStore.updateOrderStatus(id, normalizedStatus, tracking);
    return { success: true, order: updated };
  } catch (error) {
    // Try persistent store
    const stored = persistentStore.updateOrderStatus(id, normalizedStatus, tracking);
    if (stored) {
      return { success: true, order: stored };
    }
    return { success: false, error: (error as Error).message };
  }
}
