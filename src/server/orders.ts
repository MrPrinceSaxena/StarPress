import { db } from "@/lib/db";
import { Prisma, OrderStatus } from "@prisma/client";

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

    return { success: true, order };
  } catch (error) {
    console.error("Database error creating order, fallback to mock order reference:", error);
    // Graceful fallback if database is not yet provisioned in dev
    const fallbackOrder = {
      id: `mock-${Date.now()}`,
      orderNumber,
      status: "PENDING",
      totalAmount: input.totalAmount,
      shippingAddress: input.shippingAddress,
      paymentStatus: "UNPAID",
      createdAt: new Date().toISOString(),
      items: input.items,
    };
    return { success: true, order: fallbackOrder, isFallback: true };
  }
}

export async function getOrderById(idOrNumber: string) {
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
    return order;
  } catch (error) {
    console.error("Error querying order by id:", error);
    return null;
  }
}

export async function trackOrder(orderNumber: string, phoneOrEmail: string) {
  try {
    const normalizedInput = phoneOrEmail.trim().toLowerCase();
    const order = await (db.order as any).findFirst({
      where: {
        orderNumber: orderNumber.trim().toUpperCase(),
        OR: [
          { guestEmail: { equals: normalizedInput, mode: "insensitive" } },
          { guestPhone: { contains: normalizedInput } },
        ],
      },
      include: {
        items: true,
      },
    });
    return order;
  } catch (error) {
    console.error("Error tracking order:", error);
    return null;
  }
}

export async function listOrders(options?: {
  status?: OrderStatus;
  limit?: number;
  skip?: number;
}) {
  try {
    const where = options?.status ? { status: options.status } : {};
    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.skip || 0,
      include: {
        items: true,
      },
    });
    const total = await db.order.count({ where });
    return { orders, total };
  } catch (error) {
    console.error("Error listing orders:", error);
    return { orders: [], total: 0 };
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  tracking?: { trackingNumber?: string; courierPartner?: string }
) {
  try {
    const order = await db.order.update({
      where: { id },
      data: {
        status,
        ...(tracking?.trackingNumber ? { trackingNumber: tracking.trackingNumber } : {}),
        ...(tracking?.courierPartner ? { courierPartner: tracking.courierPartner } : {}),
      },
      include: { items: true },
    });
    return { success: true, order };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: (error as Error).message };
  }
}
