import { db } from "@/lib/db";
import { Prisma, OrderStatus } from "@prisma/client";
import { quoteOrder, QuoteItemInput } from "@/server/quote";
import { sendOrderPlacedProofEmail } from "@/server/email";

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
  shippingMethod?: "standard" | "rush" | "express";
  couponCode?: string;
  paymentMethod?: string;
  notes?: string;
  items: Array<{
    productId?: string;
    slug?: string;
    productSlug?: string;
    quantity: number;
    sizeId?: string;
    materialId?: string;
    customText?: string;
    artworkUrl?: string;
    previewUrl?: string;
  }>;
  idempotencyKey?: string;
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `SP-${year}-${random}`;
}

export async function createOrder(input: CreateOrderInput) {
  // 1. Validate payment method
  let normalizedPaymentMethod = (input.paymentMethod || "ONLINE").toUpperCase().trim();
  if (
    normalizedPaymentMethod === "ONLINE" ||
    normalizedPaymentMethod === "RAZORPAY"
  ) {
    normalizedPaymentMethod = "ONLINE";
  } else if (
    normalizedPaymentMethod === "PAY_AFTER_PROOF" ||
    normalizedPaymentMethod === "COD_PROOF" ||
    normalizedPaymentMethod === "MANUAL_PROOF" ||
    normalizedPaymentMethod === "COD"
  ) {
    normalizedPaymentMethod = "PAY_AFTER_PROOF";
  } else {
    const err = new Error("Invalid payment method. Only 'ONLINE' and 'PAY_AFTER_PROOF' are supported.");
    (err as any).statusCode = 400;
    throw err;
  }

  // 2. Check Idempotency Key within 24 hours
  const idempKey = input.idempotencyKey?.trim();
  if (idempKey) {
    try {
      const existingOrder = await db.order.findFirst({
        where: {
          paymentStatus: "UNPAID",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          notes: { contains: `[idempotency:${idempKey}]` },
          ...(input.userId ? { userId: input.userId } : {}),
        },
        include: { items: true },
      });

      if (existingOrder) {
        console.log(`[Order Idempotency] Returning existing unpaid order ${existingOrder.orderNumber} for key "${idempKey}"`);
        return { success: true, order: existingOrder, isExisting: true };
      }
    } catch (e) {
      console.warn("Idempotency lookup warning:", e);
    }
  }

  // 3. Authoritative server quote calculation (NEVER trust client unit prices or totals)
  const quoteItems: QuoteItemInput[] = input.items.map((it) => ({
    productId: it.productId,
    slug: it.slug || it.productSlug,
    quantity: it.quantity,
    sizeId: it.sizeId,
    materialId: it.materialId,
    customText: it.customText,
    artworkUrl: it.artworkUrl,
    previewUrl: it.previewUrl,
  }));

  const quote = await quoteOrder({
    items: quoteItems,
    couponCode: input.couponCode,
    shippingMethod: input.shippingMethod,
  });

  // 4. Check for products requiring artwork: if artworkUrl is missing, force PAY_AFTER_PROOF
  const missingArtwork = quote.lineSnapshots.some(
    (snap) => snap.requiresArtwork && (!snap.artworkUrl || snap.artworkUrl.trim() === "")
  );

  if (missingArtwork && normalizedPaymentMethod === "ONLINE") {
    console.log("[Pre-Press Policy] Order requires artwork proofing. Switching paymentMethod to PAY_AFTER_PROOF.");
    normalizedPaymentMethod = "PAY_AFTER_PROOF";
  }

  // 5. Ensure synced DB User if userId provided
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

  // 6. Build Metadata Notes
  const metadataNotes: string[] = [];
  if (input.notes?.trim()) metadataNotes.push(input.notes.trim());
  if (idempKey) metadataNotes.push(`[idempotency:${idempKey}]`);
  if (quote.couponApplied) metadataNotes.push(`[coupon:${quote.couponApplied.code}]`);
  const finalNotes = metadataNotes.length > 0 ? metadataNotes.join(" ") : null;

  const orderNumber = generateOrderNumber();

  // 7. Atomic DB Persistence (Fail closed on DB failure: No phantom JSON order fallbacks)
  try {
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: validUserId,
        guestEmail: input.guestEmail || input.shippingAddress.email,
        guestPhone: input.guestPhone || input.shippingAddress.phone,
        guestName: input.guestName || input.shippingAddress.fullName,
        status: OrderStatus.PENDING,
        subtotal: quote.subtotal,
        gstAmount: quote.gst,
        shippingFee: quote.shipping,
        discountAmount: quote.discount,
        totalAmount: quote.grandTotal,
        shippingAddress: input.shippingAddress as unknown as Prisma.InputJsonValue,
        billingAddress: input.billingAddress
          ? (input.billingAddress as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        paymentMethod: normalizedPaymentMethod,
        paymentStatus: "UNPAID",
        notes: finalNotes,
        items: {
          create: quote.lineSnapshots.map((item) => ({
            productId: item.productId || null,
            productName: item.productName,
            productSlug: item.productSlug,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            specs: item.specs as unknown as Prisma.InputJsonValue,
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

    // If order was placed under PAY_AFTER_PROOF, increment coupon usage now (since no online gateway capture)
    if (normalizedPaymentMethod === "PAY_AFTER_PROOF" && quote.couponApplied) {
      try {
        await db.discount.updateMany({
          where: { code: quote.couponApplied.code.toUpperCase() },
          data: { usedCount: { increment: 1 } },
        });
      } catch (dErr) {
        console.warn("Could not increment coupon usedCount for proof order:", dErr);
      }

      // Send Order Placed / Proof email asynchronously
      sendOrderPlacedProofEmail({
        orderNumber: order.orderNumber,
        customerName: order.guestName || input.shippingAddress.fullName,
        customerEmail: order.guestEmail || input.shippingAddress.email,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((it) => ({ productName: it.productName, quantity: it.quantity })),
      }).catch((e) => console.warn("Failed to dispatch order placed proof email:", e));
    }

    return { success: true, order };
  } catch (error: any) {
    console.error("[Database Critical Error] Failed to persist order in PostgreSQL:", error);
    const err = new Error("Database service unavailable. Order could not be created.");
    (err as any).statusCode = 503;
    throw err;
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
    if (order) return order;
  } catch (error) {
    console.warn("getOrderById database error:", error);
  }

  return null;
}

export async function trackOrder(orderNumber: string, phoneOrEmail: string) {
  const normalizedInput = phoneOrEmail.trim().toLowerCase();
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();

  try {
    const order = await db.order.findFirst({
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
    console.warn("trackOrder database error:", error);
  }

  return null;
}

export async function getOrderStats() {
  let allOrders: { id?: string; orderNumber?: string; status: string; paymentStatus?: string }[] = [];

  try {
    const dbOrders = await db.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
      },
    });
    if (Array.isArray(dbOrders)) {
      allOrders = dbOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: String(o.status || "").toUpperCase(),
        paymentStatus: String(o.paymentStatus || "").toUpperCase(),
      }));
    }
  } catch (error) {
    console.warn("getOrderStats database error:", error);
  }

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

  const unpaid = allOrders.filter((o) => o.paymentStatus === "UNPAID").length;
  const paid = allOrders.filter((o) => o.paymentStatus === "PAID").length;

  return {
    total,
    pending,
    processing,
    shipped,
    delivered,
    cancelled,
    refunded,
    unpaid,
    paid,
  };
}

export async function listOrders(options?: {
  status?: string;
  paymentStatus?: string;
  search?: string;
  limit?: number;
  skip?: number;
}) {
  try {
    const where: any = {};

    if (options?.status && options.status !== "all" && options.status !== "ALL") {
      const st = options.status.toUpperCase();
      if (st === "SHIPPED") {
        where.status = { in: ["DISPATCHED", "SHIPPED"] };
      } else if (st === "PROCESSING") {
        where.status = { in: ["CONFIRMED", "IN_PRODUCTION", "PROCESSING"] };
      } else {
        where.status = st;
      }
    }

    if (options?.paymentStatus && options.paymentStatus !== "all" && options.paymentStatus !== "ALL") {
      const ps = options.paymentStatus.toUpperCase();
      if (ps === "PAY_AFTER_PROOF") {
        where.paymentMethod = "PAY_AFTER_PROOF";
      } else {
        where.paymentStatus = ps;
      }
    }

    if (options?.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { guestName: { contains: q, mode: "insensitive" } },
        { guestEmail: { contains: q, mode: "insensitive" } },
        { guestPhone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [dbOrders, total] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
        skip: options?.skip || 0,
        take: options?.limit || 50,
      }),
      db.order.count({ where }),
    ]);

    return { orders: dbOrders, total };
  } catch (error) {
    console.error("listOrders database error:", error);
    return { orders: [], total: 0 };
  }
}

export async function updateOrderStatus(
  id: string,
  status: string,
  tracking?: { trackingNumber?: string; courierPartner?: string; notes?: string }
) {
  let normalizedStatus = status.toUpperCase();
  if (normalizedStatus === "SHIPPED") normalizedStatus = "DISPATCHED";
  if (normalizedStatus === "PROCESSING") normalizedStatus = "IN_PRODUCTION";

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

    return { success: true, order: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
