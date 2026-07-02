import "server-only";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Cross-role financial summary for the dashboard entry point.
 * - Buyer: live wallet balance
 * - Seller: income = SUM(subtotal - discount) of completed, non-reversed
 *   orders (delivery fee belongs to the driver, PPN is tax — neither is
 *   seller revenue)
 * - Driver: earnings = SUM(fee) of completed delivery jobs
 */
export async function getFinancialSummary(userId: string, roles: RoleName[]) {
  const [wallet, sellerOrders, driverJobs] = await Promise.all([
    roles.includes("BUYER")
      ? prisma.wallet.findUnique({ where: { userId } })
      : null,
    roles.includes("SELLER")
      ? prisma.order.aggregate({
          where: {
            store: { ownerId: userId },
            status: "PESANAN_SELESAI",
            incomeReversed: false,
          },
          _sum: { subtotal: true, discountAmount: true },
        })
      : null,
    roles.includes("DRIVER")
      ? prisma.deliveryJob.aggregate({
          where: { driverId: userId, status: "COMPLETED" },
          _sum: { fee: true },
        })
      : null,
  ]);

  return {
    walletBalance: wallet ? wallet.balance : null,
    sellerIncome: sellerOrders
      ? (sellerOrders._sum.subtotal ?? 0) - (sellerOrders._sum.discountAmount ?? 0)
      : null,
    driverEarnings: driverJobs ? (driverJobs._sum.fee ?? 0) : null,
  };
}
