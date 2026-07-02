import "server-only";
import { prisma } from "@/lib/prisma";
import {
  advanceVirtualDay,
  getCurrentVirtualDay,
  getVirtualDayOffset,
  getVirtualNow,
} from "@/lib/time";

/** Statuses that can still become overdue (not final). */
const OPEN_STATUSES = ["SEDANG_DIKEMAS", "MENUNGGU_PENGIRIM", "SEDANG_DIKIRIM"] as const;

export async function getClock() {
  const [offset, now, day] = await Promise.all([
    getVirtualDayOffset(),
    getVirtualNow(),
    getCurrentVirtualDay(),
  ]);
  return { offsetDays: offset, virtualNow: now, virtualDay: day };
}

// ========================= Monitoring =========================

export async function getAdminSummary() {
  const currentDay = await getCurrentVirtualDay();
  const [
    users,
    stores,
    products,
    orders,
    vouchers,
    promos,
    jobs,
    overdue,
    ordersByStatus,
    revenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.voucher.count(),
    prisma.promo.count(),
    prisma.deliveryJob.count(),
    prisma.order.count({
      where: { status: { in: [...OPEN_STATUSES] }, dueOnDay: { lt: currentDay } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.aggregate({
      where: { status: { not: "DIKEMBALIKAN" } },
      _sum: { total: true, taxAmount: true, discountAmount: true },
    }),
  ]);

  return {
    counts: { users, stores, products, orders, vouchers, promos, deliveryJobs: jobs, overdueOrders: overdue },
    ordersByStatus: Object.fromEntries(ordersByStatus.map((s) => [s.status, s._count])),
    finance: {
      grossVolume: revenue._sum.total ?? 0,
      taxCollected: revenue._sum.taxAmount ?? 0,
      discountGiven: revenue._sum.discountAmount ?? 0,
    },
  };
}

export async function listUsersAdmin() {
  return prisma.user.findMany({
    include: {
      roles: true,
      store: { select: { name: true } },
      wallet: { select: { balance: true } },
      _count: { select: { orders: true, deliveryJobs: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listStoresAdmin() {
  return prisma.store.findMany({
    include: {
      owner: { select: { name: true, username: true } },
      _count: { select: { products: { where: { deletedAt: null } }, orders: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listProductsAdmin() {
  return prisma.product.findMany({
    where: { deletedAt: null },
    include: { store: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listOrdersAdmin() {
  return prisma.order.findMany({
    include: {
      buyer: { select: { name: true, username: true } },
      store: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listDeliveriesAdmin() {
  return prisma.deliveryJob.findMany({
    include: {
      driver: { select: { name: true, username: true } },
      order: {
        select: {
          code: true,
          status: true,
          deliveryMethod: true,
          store: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Orders past their SLA that still need handling, plus already-refunded ones. */
export async function listOverdueAdmin() {
  const currentDay = await getCurrentVirtualDay();
  const [pending, refunded] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: [...OPEN_STATUSES] }, dueOnDay: { lt: currentDay } },
      include: {
        buyer: { select: { name: true, username: true } },
        store: { select: { name: true } },
      },
      orderBy: { dueOnDay: "asc" },
    }),
    prisma.order.findMany({
      where: { status: "DIKEMBALIKAN" },
      include: {
        buyer: { select: { name: true, username: true } },
        store: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  return { pending, refunded, currentDay };
}

// ====================== Overdue handling ======================

/**
 * Refund a single overdue order. Idempotency by construction:
 * the first conditional update only succeeds while the order is still in
 * an open status with refundedAt = null, so a second sweep (or a concurrent
 * one) can never refund, restore stock, or reverse income twice.
 */
async function refundOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: orderId,
        status: { in: [...OPEN_STATUSES] },
        refundedAt: null,
      },
      data: { status: "DIKEMBALIKAN", refundedAt: new Date() },
    });
    if (claimed.count === 0) return null; // already handled elsewhere

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return null;

    // 1. Money back to the buyer wallet, recorded in wallet history
    const wallet = await tx.wallet.update({
      where: { userId: order.buyerId },
      data: { balance: { increment: order.total } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "REFUND",
        amount: order.total,
        balanceAfter: wallet.balance,
        note: `Refund otomatis pesanan ${order.code} (melewati SLA pengiriman)`,
        orderId: order.id,
      },
    });

    // 2. Restore stock for every item that still exists
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    // 3. Reverse seller income if it was already counted. (Reports gate
    //    income on incomeCounted && !incomeReversed, so this flag is the
    //    single source of truth for whether the sale still counts.)
    if (order.incomeCounted && !order.incomeReversed) {
      await tx.order.update({
        where: { id: order.id },
        data: { incomeReversed: true },
      });
    }

    // 4. Return the consumed voucher slot (only vouchers have a quota). The
    //    outer refund is idempotent, so this decrement runs at most once per
    //    order; the gt:0 guard prevents underflow.
    if (order.discountKind === "VOUCHER" && order.discountCode) {
      await tx.voucher.updateMany({
        where: { code: order.discountCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }

    // 5. Cancel the delivery job so it disappears from driver boards
    await tx.deliveryJob.updateMany({
      where: { orderId: order.id, status: { in: ["AVAILABLE", "TAKEN"] } },
      data: { status: "CANCELLED" },
    });

    // 6. Visible trace in the status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "DIKEMBALIKAN",
        note: "Pesanan melewati batas SLA pengiriman — dana dikembalikan otomatis ke dompet pembeli dan stok produk dipulihkan",
        actor: "system",
      },
    });

    return order.code;
  });
}

/**
 * Sweep all overdue orders (SLA counted in simulated days by delivery
 * method: Instant = same day, Next Day = +1, Regular = +3).
 */
export async function runOverdueSweep() {
  const currentDay = await getCurrentVirtualDay();
  const overdue = await prisma.order.findMany({
    where: {
      status: { in: [...OPEN_STATUSES] },
      dueOnDay: { lt: currentDay },
      refundedAt: null,
    },
    select: { id: true },
  });

  const refundedCodes: string[] = [];
  for (const { id } of overdue) {
    const code = await refundOrder(id);
    if (code) refundedCodes.push(code);
  }
  return { checked: overdue.length, refunded: refundedCodes };
}

/** Advance the simulated clock one day, then handle anything now overdue. */
export async function simulateNextDay() {
  const offsetDays = await advanceVirtualDay();
  const sweep = await runOverdueSweep();
  const clock = await getClock();
  return { offsetDays, ...sweep, clock };
}
