import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { auditPaymentEvent } from "@/server/payment-audit";

/**
 * Sweeps the database for UNPAID orders exceeding their paymentExpiresAt timestamp.
 * Marks them CANCELLED and paymentStatus EXPIRED to prevent dangling inventory and rogue captures.
 */
export async function expireStaleOrders(client: typeof db = db): Promise<{
  scanned: number;
  expired: number;
  orderNumbers: string[];
}> {
  const now = new Date();

  const staleOrders = await client.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      paymentStatus: "UNPAID",
      paymentExpiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      orderNumber: true,
      notes: true,
      totalAmount: true,
      guestEmail: true,
    },
  });

  const expiredOrderNumbers: string[] = [];

  for (const order of staleOrders) {
    try {
      const noteAppend = `[ORDER_EXPIRED: ${now.toISOString()} payment window closed]`;
      const updatedNotes = order.notes ? `${order.notes} ${noteAppend}` : noteAppend;

      const expired = await client.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${order.id} FOR UPDATE`;
        const current = await tx.order.findUnique({ where: { id: order.id }, include: { items: true } });
        if (!current || current.status !== OrderStatus.PENDING || current.paymentStatus !== "UNPAID" || !current.paymentExpiresAt || current.paymentExpiresAt > now) {
          return false;
        }

        // Restock exactly once: only if stockRestoredAt is null
        const claimRestock = await tx.order.updateMany({
          where: { id: order.id, stockRestoredAt: null },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus: "EXPIRED",
            notes: updatedNotes,
            stockRestoredAt: now,
          },
        });

        if (claimRestock.count > 0) {
          for (const item of current.items) {
            if (!item.productId) continue;
            await tx.product.updateMany({
              where: { id: item.productId, trackInventory: true },
              data: { stockQuantity: { increment: item.quantity } },
            });
          }
        } else {
          // Already restocked, simply update status to CANCELLED/EXPIRED
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CANCELLED, paymentStatus: "EXPIRED", notes: updatedNotes },
          });
        }

        return true;
      });
      if (!expired) continue;

      await auditPaymentEvent({
        orderId: order.id,
        action: "ORDER_EXPIRED",
        actor: "SYSTEM:CRON",
        details: {
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
        },
      });

      expiredOrderNumbers.push(order.orderNumber);
    } catch (err) {
      console.error(`[Order Expiry] Failed to expire order #${order.orderNumber}:`, err);
    }
  }

  return {
    scanned: staleOrders.length,
    expired: expiredOrderNumbers.length,
    orderNumbers: expiredOrderNumbers,
  };
}

/**
 * Scans for recently abandoned orders (20+ mins old, UNPAID, not yet expired/cancelled)
 * and sends an automated 1-click recovery email to recover abandoned sales.
 */
export async function recoverAbandonedCheckouts(client: typeof db = db): Promise<{
  scanned: number;
  recoveredSent: number;
  orderNumbers: string[];
}> {
  const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const candidateOrders = await client.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      paymentStatus: "UNPAID",
      createdAt: {
        lte: twentyMinsAgo,
        gte: twelveHoursAgo,
      },
      NOT: {
        notes: {
          contains: "[RECOVERY_EMAIL_SENT]",
        },
      },
    },
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
    take: 50,
  });

  const sentOrderNumbers: string[] = [];

  for (const order of candidateOrders) {
    try {
      const recipientEmail = order.guestEmail || order.user?.email;
      const recipientName = order.guestName || order.user?.name || "Customer";

      if (!recipientEmail) continue;

      const { sendAbandonedCheckoutRecoveryEmail } = await import("@/server/email");
      const sent = await sendAbandonedCheckoutRecoveryEmail({
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: recipientName,
        customerEmail: recipientEmail,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((it) => ({
          name: it.productName,
          quantity: it.quantity,
        })),
      });

      if (sent) {
        const noteStamp = `[RECOVERY_EMAIL_SENT: ${new Date().toISOString()}]`;
        await client.order.update({
          where: { id: order.id },
          data: {
            notes: order.notes ? `${order.notes} ${noteStamp}` : noteStamp,
          },
        });

        await auditPaymentEvent({
          orderId: order.id,
          action: "RECOVERY_NUDGE_SENT",
          actor: "SYSTEM:CRON",
          details: {
            orderNumber: order.orderNumber,
            recipientEmail,
            totalAmount: Number(order.totalAmount),
          },
        });

        sentOrderNumbers.push(order.orderNumber);
      }
    } catch (err) {
      console.error(`[Abandoned Checkout Recovery] Error processing order #${order.orderNumber}:`, err);
    }
  }

  return {
    scanned: candidateOrders.length,
    recoveredSent: sentOrderNumbers.length,
    orderNumbers: sentOrderNumbers,
  };
}
