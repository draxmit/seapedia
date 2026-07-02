import "server-only";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";

/**
 * Public catalog reads are cached in the Next.js data cache and tagged with
 * CATALOG_TAG. Seller product/store mutations call revalidateTag(CATALOG_TAG)
 * so the catalog stays fresh while guests get instant, DB-free page loads.
 */
export const CATALOG_TAG = "catalog";
const CACHE_TTL = 120; // seconds — safety net beyond tag-based revalidation

const publicProductInclude = {
  store: { select: { id: true, name: true, slug: true, city: true, logoUrl: true } },
} satisfies Prisma.ProductInclude;

export type PublicProduct = Prisma.ProductGetPayload<{
  include: typeof publicProductInclude;
}>;

type ListParams = {
  search?: string;
  category?: string;
  storeSlug?: string;
  page?: number;
  perPage?: number;
};

async function queryPublicProducts(params: ListParams) {
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

const cachedListProducts = unstable_cache(queryPublicProducts, ["public-products"], {
  tags: [CATALOG_TAG],
  revalidate: CACHE_TTL,
});

/** Public catalog listing with optional search / category / store filters. */
export function listPublicProducts(params: ListParams) {
  return cachedListProducts(params);
}

const cachedProductBySlug = unstable_cache(
  (slug: string) =>
    prisma.product.findFirst({ where: { slug, deletedAt: null }, include: publicProductInclude }),
  ["public-product"],
  { tags: [CATALOG_TAG], revalidate: CACHE_TTL },
);

export async function getPublicProduct(slug: string): Promise<PublicProduct> {
  const product = await cachedProductBySlug(slug);
  if (!product) throw new ApiError(404, "Produk tidak ditemukan");
  return product;
}

export const listCategories = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await prisma.product.findMany({
      where: { deletedAt: null, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return rows.map((r) => r.category!).filter(Boolean);
  },
  ["public-categories"],
  { tags: [CATALOG_TAG], revalidate: CACHE_TTL },
);

const cachedStoreBySlug = unstable_cache(
  (slug: string) =>
    prisma.store.findUnique({
      where: { slug },
      include: { _count: { select: { products: { where: { deletedAt: null } } } } },
    }),
  ["public-store"],
  { tags: [CATALOG_TAG], revalidate: CACHE_TTL },
);

export async function getPublicStore(slug: string) {
  const store = await cachedStoreBySlug(slug);
  if (!store) throw new ApiError(404, "Toko tidak ditemukan");
  return store;
}
