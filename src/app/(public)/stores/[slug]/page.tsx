import { notFound } from "next/navigation";
import { getPublicStore, listPublicProducts } from "@/server/services/product-service";
import { ApiError } from "@/server/api";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let store;
  try {
    store = await getPublicStore(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const { products } = await listPublicProducts({ storeSlug: slug, perPage: 48 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      {/* Store header */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-950/5">
        <div className="h-28 bg-gradient-to-r from-brand-600 via-brand-700 to-brand-900" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <span className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl font-extrabold text-brand-700 shadow-lift ring-4 ring-white">
              {store.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="pb-1">
              <h1 className="text-xl font-extrabold tracking-tight text-ink-950">
                {store.name}
              </h1>
              <p className="mt-0.5 text-sm text-ink-500">
                {store.city && <span>{store.city} · </span>}
                {store._count.products} produk
              </p>
            </div>
          </div>
          {store.description && (
            <p className="max-w-md text-sm leading-relaxed text-ink-500">
              {store.description}
            </p>
          )}
        </div>
      </div>

      {/* Products */}
      <h2 className="mt-10 text-lg font-extrabold tracking-tight text-ink-950">
        Produk dari {store.name}
      </h2>
      {products.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Belum ada produk"
            description="Toko ini belum menambahkan produk apa pun."
          />
        </div>
      )}
    </div>
  );
}
