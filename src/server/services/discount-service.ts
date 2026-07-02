import "server-only";
import type { DiscountKind, DiscountValueType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";
import { getVirtualNow } from "@/lib/time";
import { formatIDR } from "@/lib/money";

export type ResolvedDiscount = {
  kind: DiscountKind;
  code: string;
  name: string;
  valueType: DiscountValueType;
  value: number;
  amount: number; // computed discount in IDR for the given subtotal
};

function computeAmount(
  valueType: DiscountValueType,
  value: number,
  maxDiscount: number | null,
  subtotal: number,
): number {
  const raw =
    valueType === "PERCENT" ? Math.round((subtotal * value) / 100) : value;
  const capped = maxDiscount != null ? Math.min(raw, maxDiscount) : raw;
  return Math.min(capped, subtotal); // a discount can never exceed the subtotal
}

/**
 * Resolves a discount code against BOTH voucher and promo tables.
 * Business rule (documented in the README): exactly ONE code per checkout —
 * Voucher and Promo cannot be stacked. Expiry follows the simulated clock
 * so time-travel demos behave consistently.
 */
export async function resolveDiscount(
  code: string,
  subtotal: number,
): Promise<ResolvedDiscount> {
  const now = await getVirtualNow();
  const normalized = code.trim().toUpperCase();

  const [voucher, promo] = await Promise.all([
    prisma.voucher.findUnique({ where: { code: normalized } }),
    prisma.promo.findUnique({ where: { code: normalized } }),
  ]);

  if (voucher) {
    if (voucher.expiresAt < now) {
      throw new ApiError(400, "Voucher sudah kedaluwarsa");
    }
    if (voucher.usedCount >= voucher.maxUsage) {
      throw new ApiError(400, "Kuota penggunaan voucher sudah habis");
    }
    if (subtotal < voucher.minSubtotal) {
      throw new ApiError(
        400,
        `Voucher ini butuh minimal belanja ${formatIDR(voucher.minSubtotal)}`,
      );
    }
    return {
      kind: "VOUCHER",
      code: voucher.code,
      name: voucher.name,
      valueType: voucher.valueType,
      value: voucher.value,
      amount: computeAmount(voucher.valueType, voucher.value, voucher.maxDiscount, subtotal),
    };
  }

  if (promo) {
    if (promo.expiresAt < now) {
      throw new ApiError(400, "Promo sudah berakhir");
    }
    if (subtotal < promo.minSubtotal) {
      throw new ApiError(
        400,
        `Promo ini butuh minimal belanja ${formatIDR(promo.minSubtotal)}`,
      );
    }
    return {
      kind: "PROMO",
      code: promo.code,
      name: promo.name,
      valueType: promo.valueType,
      value: promo.value,
      amount: computeAmount(promo.valueType, promo.value, promo.maxDiscount, subtotal),
    };
  }

  throw new ApiError(404, "Kode voucher/promo tidak ditemukan");
}

/** Public list of currently usable vouchers and promos. */
export async function listActiveDiscounts() {
  const now = await getVirtualNow();
  const [vouchers, promos] = await Promise.all([
    prisma.voucher.findMany({
      where: { expiresAt: { gte: now } },
      orderBy: { expiresAt: "asc" },
    }),
    prisma.promo.findMany({
      where: { expiresAt: { gte: now } },
      orderBy: { expiresAt: "asc" },
    }),
  ]);
  return {
    vouchers: vouchers.filter((v) => v.usedCount < v.maxUsage),
    promos,
  };
}
