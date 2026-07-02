import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Buyer spending report: every order with its full financial breakdown,
 * plus aggregates. Refunded (Dikembalikan) orders are surfaced separately —
 * the money came back to the wallet, so they don't count as net spending.
 */
export async function getBuyerReport(userId: string) {
  const orders = await prisma.order.findMany({
    where: { buyerId: userId },
    include: { store: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  const active = orders.filter((o) => o.status !== "DIKEMBALIKAN");
  const refunded = orders.filter((o) => o.status === "DIKEMBALIKAN");

  return {
    orders,
    summary: {
      totalOrders: orders.length,
      completedOrders: orders.filter((o) => o.status === "PESANAN_SELESAI").length,
      refundedOrders: refunded.length,
      totalSpent: active.reduce((s, o) => s + o.total, 0),
      totalRefunded: refunded.reduce((s, o) => s + o.total, 0),
      totalDiscount: active.reduce((s, o) => s + o.discountAmount, 0),
      totalTax: active.reduce((s, o) => s + o.taxAmount, 0),
      totalDeliveryFee: active.reduce((s, o) => s + o.deliveryFee, 0),
    },
  };
}

/**
 * Seller income report. Income = subtotal - discount, counted only for
 * Pesanan Selesai and excluding reversed orders (overdue refunds). PPN is
 * tax and the delivery fee belongs to the driver — neither is revenue.
 */
export async function getSellerReport(ownerId: string) {
  const orders = await prisma.order.findMany({
    where: { store: { ownerId } },
    include: { buyer: { select: { name: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });

  const completed = orders.filter((o) => o.incomeCounted && !o.incomeReversed);
  const reversed = orders.filter((o) => o.incomeReversed);
  const inProgress = orders.filter(
    (o) => !["PESANAN_SELESAI", "DIKEMBALIKAN"].includes(o.status),
  );

  const incomeOf = (list: typeof orders) =>
    list.reduce((s, o) => s + o.subtotal - o.discountAmount, 0);

  return {
    orders,
    summary: {
      totalOrders: orders.length,
      completedOrders: completed.length,
      inProgressOrders: inProgress.length,
      refundedOrders: orders.filter((o) => o.status === "DIKEMBALIKAN").length,
      totalIncome: incomeOf(completed),
      pendingIncome: incomeOf(inProgress),
      reversedIncome: incomeOf(reversed),
    },
  };
}
