import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";
import type { z } from "zod";
import type { productSchema, storeSchema } from "@/server/validation";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Generates a unique slug, appending a numeric suffix on collision. */
async function uniqueSlug(
  table: "store" | "product",
  name: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(name) || "item";
  let candidate = base;
  for (let i = 2; ; i++) {
    const existing =
      table === "store"
        ? await prisma.store.findUnique({ where: { slug: candidate } })
        : await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${i}`;
  }
}

// ============================ Store =============================

export async function getOwnStore(ownerId: string) {
  return prisma.store.findUnique({
    where: { ownerId },
    include: { _count: { select: { products: { where: { deletedAt: null } } } } },
  });
}

/**
 * Store names must be unique marketplace-wide. Enforced both here (friendly
 * error) and by the database unique constraint (race safety).
 */
async function assertStoreNameFree(name: string, excludeOwnerId?: string) {
  const existing = await prisma.store.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing && existing.ownerId !== excludeOwnerId) {
    throw new ApiError(409, "Nama toko sudah digunakan, silakan pilih nama lain");
  }
}

export async function createStore(
  ownerId: string,
  input: z.infer<typeof storeSchema>,
) {
  const current = await prisma.store.findUnique({ where: { ownerId } });
  if (current) throw new ApiError(409, "Kamu sudah memiliki toko");
  await assertStoreNameFree(input.name);

  return prisma.store.create({
    data: {
      ownerId,
      name: input.name,
      slug: await uniqueSlug("store", input.name),
      description: input.description,
      city: input.city,
    },
  });
}

export async function updateStore(
  ownerId: string,
  input: z.infer<typeof storeSchema>,
) {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, "Kamu belum memiliki toko");
  await assertStoreNameFree(input.name, ownerId);

  return prisma.store.update({
    where: { id: store.id },
    data: {
      name: input.name,
      slug:
        input.name === store.name
          ? store.slug
          : await uniqueSlug("store", input.name, store.id),
      description: input.description,
      city: input.city,
    },
  });
}

// =========================== Products ===========================

/** Resolves the seller's store or fails: products always belong to a store. */
async function requireStore(ownerId: string) {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) {
    throw new ApiError(400, "Buat toko terlebih dahulu sebelum mengelola produk");
  }
  return store;
}

/**
 * Ownership guard: sellers may only touch products of their own store.
 * A cross-store id gets 404 (not 403) to avoid leaking product existence.
 */
async function requireOwnProduct(ownerId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, store: { ownerId } },
  });
  if (!product) throw new ApiError(404, "Produk tidak ditemukan di tokomu");
  return product;
}

export async function listOwnProducts(ownerId: string) {
  const store = await requireStore(ownerId);
  return prisma.product.findMany({
    where: { storeId: store.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(
  ownerId: string,
  input: z.infer<typeof productSchema>,
) {
  const store = await requireStore(ownerId);
  return prisma.product.create({
    data: {
      storeId: store.id,
      name: input.name,
      slug: await uniqueSlug("product", input.name),
      description: input.description,
      price: input.price,
      stock: input.stock,
      imageUrl: input.imageUrl,
      category: input.category,
    },
  });
}

export async function updateProduct(
  ownerId: string,
  productId: string,
  input: z.infer<typeof productSchema>,
) {
  const product = await requireOwnProduct(ownerId, productId);
  return prisma.product.update({
    where: { id: product.id },
    data: {
      name: input.name,
      slug:
        input.name === product.name
          ? product.slug
          : await uniqueSlug("product", input.name, product.id),
      description: input.description,
      price: input.price,
      stock: input.stock,
      imageUrl: input.imageUrl,
      category: input.category,
    },
  });
}

/**
 * Soft delete: the product disappears from the catalog and seller list but
 * stays referenced by past order items so order history remains intact.
 */
export async function deleteProduct(ownerId: string, productId: string) {
  const product = await requireOwnProduct(ownerId, productId);
  await prisma.product.update({
    where: { id: product.id },
    data: { deletedAt: new Date() },
  });
  // Remove it from any open carts so buyers don't checkout a dead product
  await prisma.cartItem.deleteMany({ where: { productId: product.id } });
}
