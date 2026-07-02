import "server-only";
import type { DeliveryMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";
import { DELIVERY_FEES, PPN_RATE, SLA_DAYS } from "@/lib/constants";
import { getCurrentVirtualDay } from "@/lib/time";
import { resolveDiscount, type ResolvedDiscount } from "@/server/services/discount-service";

/**
 * Money model (documented in the README):
 *   taxable base = subtotal - discount   (discount applies BEFORE PPN)
 *   PPN          = 12% of the taxable base, rounded to the nearest rupiah
 *   total        = taxable base + PPN + delivery fee
 */
export function computeTotals(params: {
  subtotal: number;
  discountAmount: number;
  deliveryMethod: DeliveryMethod;
}) {
  const { subtotal, discountAmount, deliveryMethod } = params;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableBase * PPN_RATE);
  const deliveryFee = DELIVERY_FEES[deliveryMethod];
  const total = taxableBase + taxAmount + deliveryFee;
  return { subtotal, discountAmount, taxAmount, deliveryFee, total };
}

function generateOrderCode(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SEA-${datePart}-${rand}`;
}

/**
 * Prices the current cart for a delivery method + optional discount code.
 * Used by the checkout page preview; the same math runs again inside the
 * checkout transaction so the client can never dictate amounts.
 */
export async function quoteCheckout(
  userId: string,
  deliveryMethod: DeliveryMethod,
  discountCode?: string,
) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Keranjangmu masih kosong");
  }

  const subtotal = cart.items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );
  const discount: ResolvedDiscount | null = discountCode
    ? await resolveDiscount(discountCode, subtotal)
    : null;

  return {
    ...computeTotals({
      subtotal,
      discountAmount: discount?.amount ?? 0,
      deliveryMethod,
    }),
    discount,
  };
}

/**
 * The checkout transaction. All mutations are atomic and race-safe:
 * - stock is decremented with a conditional update (never below zero)
 * - wallet is charged with a balance guard (no overdraft)
 * - voucher usage is consumed with a quota guard (no over-redemption)
 * On any failure the whole transaction rolls back.
 */
export async function checkout(
  userId: string,
  input: {
    addressId: string;
    deliveryMethod: DeliveryMethod;
    discountCode?: string;
  },
) {
  const currentDay = await getCurrentVirtualDay();

  // Pre-transaction reads: cart contents, address ownership, and discount
  // validation. The mutations below re-verify everything with conditional
  // updates, so a stale read here can only cause a clean failure, never a
  // wrong charge.
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { product: { include: { store: true } } } },
    },
  });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Keranjangmu masih kosong");
  }

  // Single-store rule is a data invariant of the cart; verify anyway
  const storeIds = new Set(cart.items.map((i) => i.product.storeId));
  if (storeIds.size !== 1) {
    throw new ApiError(400, "Keranjang hanya boleh berisi produk dari satu toko");
  }
  const store = cart.items[0].product.store;
  if (store.ownerId === userId) {
    throw new ApiError(400, "Kamu tidak bisa membeli produk dari tokomu sendiri");
  }

  const address = await prisma.address.findFirst({
    where: { id: input.addressId, userId },
  });
  if (!address) throw new ApiError(404, "Alamat pengiriman tidak ditemukan");

  const subtotal = cart.items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );

  let discount: ResolvedDiscount | null = null;
  if (input.discountCode) {
    discount = await resolveDiscount(input.discountCode, subtotal);
  }

  return prisma.$transaction(
    async (tx) => {
      // ---- Stock: conditional decrement, never negative ----
      for (const item of cart.items) {
        if (item.product.deletedAt) {
          throw new ApiError(400, `Produk "${item.product.name}" sudah tidak dijual`);
        }
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity }, deletedAt: null },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new ApiError(400, `Stok "${item.product.name}" tidak mencukupi`);
        }
      }

      // ---- Voucher quota: consumed atomically with a usage guard ----
      if (discount?.kind === "VOUCHER") {
        const consumed = await tx.voucher.updateMany({
          where: {
            code: discount.code,
            usedCount: { lt: prisma.voucher.fields.maxUsage },
          },
          data: { usedCount: { increment: 1 } },
        });
        if (consumed.count === 0) {
          throw new ApiError(400, "Kuota penggunaan voucher sudah habis");
        }
      }

      const totals = computeTotals({
        subtotal,
        discountAmount: discount?.amount ?? 0,
        deliveryMethod: input.deliveryMethod,
      });

      // ---- Wallet: guarded charge, no overdraft ----
      const charged = await tx.wallet.updateMany({
        where: { userId, balance: { gte: totals.total } },
        data: { balance: { decrement: totals.total } },
      });
      if (charged.count === 0) {
        throw new ApiError(400, "Saldo dompet tidak mencukupi — silakan top up terlebih dahulu");
      }
      const wallet = await tx.wallet.findUnique({ where: { userId } });

      // ---- Order + snapshot items + initial status history ----
      const order = await tx.order.create({
        data: {
          code: generateOrderCode(),
          buyerId: userId,
          storeId: store.id,
          status: "SEDANG_DIKEMAS",
          deliveryMethod: input.deliveryMethod,
          recipient: address.recipient,
          phone: address.phone,
          fullAddress: `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          discountCode: discount?.code,
          discountKind: discount?.kind,
          taxAmount: totals.taxAmount,
          deliveryFee: totals.deliveryFee,
          total: totals.total,
          placedOnDay: currentDay,
          dueOnDay: currentDay + SLA_DAYS[input.deliveryMethod],
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              productName: i.product.name,
              productImage: i.product.imageUrl,
              unitPrice: i.product.price,
              quantity: i.quantity,
              lineTotal: i.product.price * i.quantity,
            })),
          },
          statusHistory: {
            create: {
              status: "SEDANG_DIKEMAS",
              note: "Pesanan dibuat dan pembayaran diterima",
              actor: "system",
            },
          },
        },
        include: { items: true, statusHistory: true },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          type: "PAYMENT",
          amount: -totals.total,
          balanceAfter: wallet!.balance,
          note: `Pembayaran pesanan ${order.code}`,
          orderId: order.id,
        },
      });

      // ---- Empty the cart ----
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { storeId: null } });

      return order;
    },
    // Generous timeout: the hosted dev database sits in another region and
    // each round trip costs real latency. Correctness never depends on the
    // isolation level here — every mutation carries its own guard.
    { timeout: 30_000, maxWait: 10_000 },
  );
}

/**
 * Seller action (Level 4): move an order from Sedang Dikemas to
 * Menunggu Pengirim and publish the delivery job for drivers. Only the
 * store owner may process, and only from the correct status — enforced
 * with a conditional update so double-clicks can't double-process.
 */
export async function processOrder(ownerId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, store: { ownerId } },
  });
  if (!order) throw new ApiError(404, "Pesanan tidak ditemukan");
  if (order.status !== "SEDANG_DIKEMAS") {
    throw new ApiError(400, "Pesanan ini sudah diproses");
  }

  return prisma.$transaction(async (tx) => {
    const moved = await tx.order.updateMany({
      where: { id: orderId, status: "SEDANG_DIKEMAS" },
      data: { status: "MENUNGGU_PENGIRIM" },
    });
    if (moved.count === 0) throw new ApiError(400, "Pesanan ini sudah diproses");

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "MENUNGGU_PENGIRIM",
        note: "Penjual selesai mengemas — menunggu driver mengambil pesanan",
        actor: "seller",
      },
    });
    await tx.deliveryJob.create({
      data: { orderId, fee: order.deliveryFee, status: "AVAILABLE" },
    });

    return tx.order.findUnique({
      where: { id: orderId },
      include: { statusHistory: { orderBy: { createdAt: "asc" } } },
    });
  });
}

// ========================= Order queries =========================

const orderListInclude = {
  items: true,
  store: { select: { name: true, slug: true, city: true } },
} satisfies Prisma.OrderInclude;

export async function listBuyerOrders(userId: string) {
  return prisma.order.findMany({
    where: { buyerId: userId },
    include: orderListInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getBuyerOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: userId },
    include: {
      items: true,
      store: { select: { name: true, slug: true, city: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      deliveryJob: {
        include: { driver: { select: { name: true, username: true } } },
      },
    },
  });
  if (!order) throw new ApiError(404, "Pesanan tidak ditemukan");
  return order;
}

/** Incoming orders for the seller who owns the store. */
export async function listSellerOrders(ownerId: string) {
  return prisma.order.findMany({
    where: { store: { ownerId } },
    include: {
      items: true,
      buyer: { select: { name: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSellerOrder(ownerId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, store: { ownerId } },
    include: {
      items: true,
      buyer: { select: { name: true, username: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      deliveryJob: {
        include: { driver: { select: { name: true, username: true } } },
      },
    },
  });
  if (!order) throw new ApiError(404, "Pesanan tidak ditemukan");
  return order;
}
