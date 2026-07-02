import Link from "next/link";
import type { Metadata } from "next";
import { listCategories, listPublicProducts } from "@/server/services/product-service";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Jelajahi Produk" };
// Rendered per request; catalog reads are served from the cache-tagged data
// cache, so there is no per-request database round trip.
export const dynamic = "force-dynamic";

type Search = { search?: string; category?: string; page?: string };

function buildQuery(params: Search, overrides: Partial<Search>): string {
  const merged = { ...params, ...overrides };
  const qs = new URLSearchParams();
  if (merged.search) qs.set("search", merged.search);
  if (merged.category) qs.set("category", merged.category);
  if (merged.page && merged.page !== "1") qs.set("page", merged.page);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const [result, categories] = await Promise.all([
    listPublicProducts({
      search: params.search,
      category: params.category,
      page: Number(params.page) || 1,
    }),
    listCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          {params.search ? (
            <>
              Hasil untuk{" "}
              <span className="text-brand-700">&ldquo;{params.search}&rdquo;</span>
            </>
          ) : (
            "Jelajahi Produk"
          )}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {result.total} produk dari berbagai toko di SEAPEDIA
        </p>
      </header>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="scrollbar-none mt-5 flex gap-2 overflow-x-auto pb-1">
          <CategoryChip
            href={`/products${buildQuery(params, { category: undefined, page: undefined })}`}
            active={!params.category}
          >
            Semua
          </CategoryChip>
          {categories.map((c) => (
            <CategoryChip
              key={c}
              href={`/products${buildQuery(params, { category: c, page: undefined })}`}
              active={params.category === c}
            >
              {c}
            </CategoryChip>
          ))}
        </div>
      )}

      {result.products.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {result.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Tidak ada produk ditemukan"
            description={
              params.search
                ? `Tidak ada produk yang cocok dengan "${params.search}". Coba kata kunci lain.`
                : "Belum ada produk pada kategori ini."
            }
          />
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/products${buildQuery(params, { page: String(n) })}`}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-colors",
                n === result.page
                  ? "bg-brand-600 text-white"
                  : "bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50",
              )}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "bg-brand-600 text-white shadow-card"
          : "bg-white text-ink-600 ring-1 ring-ink-200 hover:text-brand-700 hover:ring-brand-300",
      )}
    >
      {children}
    </Link>
  );
}
