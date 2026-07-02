import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";

const publicProductInclude = {
  store: { select: { id: true, name: true, slug: true, city: true, logoUrl: true } },
} satisfies Prisma.ProductInclude;

export type PublicProduct = Prisma.ProductGetPayload<{
  include: typeof publicProductInclude;
}>;

/** Public catalog listing with optional search / category / store filters. */
export async function listPublicProducts(params: {
  search?: string;
  category?: string;
  storeSlug?: string;
  page?: number;
  perPage?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(48, Math.max(1, params.perPage ?? 24));

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { description: { contains: params.search, mode: "insensitive" } },
            { store: { name: { contains: params.search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.storeSlug ? { store: { slug: params.storeSlug } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: publicProductInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getPublicProduct(slug: string): Promise<PublicProduct> {
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    include: publicProductInclude,
  });
  if (!product) throw new ApiError(404, "Produk tidak ditemukan");
  return product;
}

export async function listCategories(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { deletedAt: null, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category!).filter(Boolean);
}

export async function getPublicStore(slug: string) {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
  });
  if (!store) throw new ApiError(404, "Toko tidak ditemukan");
  return store;
}
