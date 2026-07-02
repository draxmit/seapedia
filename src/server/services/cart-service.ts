import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          store: { select: { id: true, name: true, slug: true, city: true } },
        },
      },
    },
    orderBy: { id: "asc" as const },
  },
};

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: cartInclude,
  });
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const store = cart.items[0]?.product.store ?? null;
  return { ...cart, subtotal, store };
}

/**
 * Adds a product to the cart, enforcing the single-store rule:
 * one cart may only contain products from ONE store. Attempting to add a
 * product from a different store returns 409 so the UI can offer to clear
 * the cart first.
 */
export async function addCartItem(userId: string, productId: string, quantity: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    include: { store: { select: { id: true, name: true, ownerId: true } } },
  });
  if (!product) throw new ApiError(404, "Produk tidak ditemukan");
  if (product.store.ownerId === userId) {
    throw new ApiError(400, "Kamu tidak bisa membeli produk dari tokomu sendiri");
  }

  const cart = await getOrCreateCart(userId);

  if (cart.items.length > 0 && cart.storeId && cart.storeId !== product.storeId) {
    const currentStore = cart.items[0].product.store.name;
    throw new ApiError(
      409,
      `Keranjangmu berisi produk dari toko "${currentStore}". Satu keranjang hanya boleh berisi produk dari satu toko — kosongkan keranjang untuk membeli dari toko lain.`,
    );
  }

  const existing = cart.items.find((i) => i.productId === productId);
  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty > product.stock) {
    throw new ApiError(400, `Stok tidak cukup — tersisa ${product.stock} untuk produk ini`);
  }

  await prisma.$transaction([
    prisma.cart.update({
      where: { id: cart.id },
      data: { storeId: product.storeId },
    }),
    existing
      ? prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: newQty },
        })
      : prisma.cartItem.create({
          data: { cartId: cart.id, productId, quantity },
        }),
  ]);

  return getCart(userId);
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
    include: { product: true },
  });
  if (!item) throw new ApiError(404, "Item keranjang tidak ditemukan");
  if (quantity > item.product.stock) {
    throw new ApiError(400, `Stok tidak cukup — tersisa ${item.product.stock} untuk produk ini`);
  }
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return getCart(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
  });
  if (!item) throw new ApiError(404, "Item keranjang tidak ditemukan");
  await prisma.cartItem.delete({ where: { id: item.id } });

  // Unlock the store when the cart becomes empty
  const remaining = await prisma.cartItem.count({ where: { cartId: item.cartId } });
  if (remaining === 0) {
    await prisma.cart.update({ where: { id: item.cartId }, data: { storeId: null } });
  }
  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } }),
  ]);
  return getCart(userId);
}
