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
    const order = await (db.order as any).create({
      data: {
        orderNumber,
        userId: input.userId || null,
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

export async function listOrders(options?: {
  status?: string;
  search?: string;
  limit?: number;
  skip?: number;
}) {
  let dbOrders: any[] = [];
  let dbTotal = 0;

  try {
    const where: any = {};
    if (options?.status && options.status !== "all" && options.status !== "ALL") {
      where.status = options.status.toUpperCase();
    }
    if (options?.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { guestName: { contains: q, mode: "insensitive" } },
        { guestEmail: { contains: q, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit || 50,
        skip: options?.skip || 0,
        include: {
          items: true,
        },
      }),
      db.order.count({ where }),
    ]);

    dbOrders = orders;
    dbTotal = total;
  } catch (error) {
    // Fallback to persistent storage
  }

  // Combine or fallback to persistentStore
  if (dbOrders.length === 0 && dbTotal === 0) {
    let stored = persistentStore.getOrders();

    if (options?.search?.trim()) {
      const q = options.search.trim().toLowerCase();
      stored = stored.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          (o.guestName && o.guestName.toLowerCase().includes(q)) ||
          (o.guestEmail && o.guestEmail.toLowerCase().includes(q))
      );
    }

    if (options?.status && options.status !== "all" && options.status !== "ALL") {
      const s = options.status.toUpperCase();
      stored = stored.filter((o) => o.status.toUpperCase() === s);
    }

    stored.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = stored.length;
    const skip = options?.skip || 0;
    const limit = options?.limit || 50;
    const paged = stored.slice(skip, skip + limit);

    return { orders: paged, total };
  }

  return { orders: dbOrders, total: dbTotal };
}

export async function updateOrderStatus(
  id: string,
  status: string,
  tracking?: { trackingNumber?: string; courierPartner?: string; notes?: string }
) {
  // First try Prisma DB
  try {
    const updated = await db.order.update({
      where: { id },
      data: {
        status: status.toUpperCase() as OrderStatus,
        ...(tracking?.trackingNumber ? { trackingNumber: tracking.trackingNumber } : {}),
        ...(tracking?.courierPartner ? { courierPartner: tracking.courierPartner } : {}),
        ...(tracking?.notes ? { notes: tracking.notes } : {}),
      },
      include: { items: true },
    });

    persistentStore.updateOrderStatus(id, status.toUpperCase(), tracking);
    return { success: true, order: updated };
  } catch (error) {
    // Try persistent store
    const stored = persistentStore.updateOrderStatus(id, status.toUpperCase(), tracking);
    if (stored) {
      return { success: true, order: stored };
    }
    return { success: false, error: (error as Error).message };
  }
}
