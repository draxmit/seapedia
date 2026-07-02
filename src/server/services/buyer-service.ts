import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";
import type { z } from "zod";
import type { addressSchema } from "@/server/validation";

// ============================ Wallet ============================

export async function getWallet(userId: string) {
  // Wallets are provisioned at registration; upsert covers legacy accounts
  return prisma.wallet.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
}

/** Dummy top-up: instantly credits the wallet and records the transaction. */
export async function topUpWallet(userId: string, amount: number) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      create: { userId, balance: 0 },
      update: {},
    });
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "TOPUP",
        amount,
        balanceAfter: updated.balance,
        note: "Top up saldo dompet",
      },
    });
    return updated;
  });
}

// =========================== Addresses ==========================

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

async function requireOwnAddress(userId: string, addressId: string) {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) throw new ApiError(404, "Alamat tidak ditemukan");
  return address;
}

export async function createAddress(
  userId: string,
  input: z.infer<typeof addressSchema>,
) {
  const count = await prisma.address.count({ where: { userId } });
  const makeDefault = input.isDefault || count === 0;
  return prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: { ...input, isDefault: makeDefault, userId },
    });
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: z.infer<typeof addressSchema>,
) {
  await requireOwnAddress(userId, addressId);
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.update({
      where: { id: addressId },
      data: { ...input, isDefault: input.isDefault ?? false },
    });
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  await requireOwnAddress(userId, addressId);
  await prisma.address.delete({ where: { id: addressId } });
}
