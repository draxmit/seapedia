import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAuth } from "@/server/auth";
import { getPublicProduct } from "@/server/services/product-service";
import { ApiError } from "@/server/api";
import { formatIDR } from "@/lib/money";
import { AddToCart } from "@/components/product/add-to-cart";
import { Badge } from "@/components/ui/badge";

// Rendered per request; the product read is served from the cache-tagged
// data cache, so there is no per-request database round trip.
export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product;
  try {
    product = await getPublicProduct(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const auth = await getAuth();
  const isActiveBuyer = auth?.activeRole === "BUYER";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-ink-400" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-brand-700">Beranda</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/products" className="hover:text-brand-700">Produk</Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/products?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-brand-700"
                >
                  {product.category}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li className="max-w-40 truncate font-medium text-ink-600">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1fr_20rem]">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-ink-100 shadow-card ring-1 ring-ink-950/5">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-16 w-16">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && <Badge tone="brand">{product.category}</Badge>}
          <h1 className="mt-2 text-2xl leading-snug font-extrabold tracking-tight text-ink-950">
            {product.name}
          </h1>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-brand-700">
            {formatIDR(product.price)}
          </p>

          <div className="mt-6 border-t border-ink-100 pt-5">
            <h2 className="text-sm font-bold text-ink-900">Deskripsi Produk</h2>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-600">
              {product.description}
            </p>
          </div>

          {/* Store block */}
          <Link
            href={`/stores/${product.store.slug}`}
            className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink-950/5 transition-shadow hover:shadow-lift"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-base font-extrabold text-white">
              {product.store.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink-900">
                {product.store.name}
              </span>
              {product.store.city && (
                <span className="text-xs text-ink-500">{product.store.city}</span>
              )}
            </span>
            <span className="text-xs font-semibold text-brand-700">
              Kunjungi Toko →
            </span>
          </Link>
        </div>

        {/* Purchase panel */}
        <aside>
          <div className="sticky top-24 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
            <h2 className="text-sm font-bold text-ink-900">
              {isActiveBuyer ? "Atur Pembelian" : "Ingin membeli produk ini?"}
            </h2>
            <div className="mt-4">
              {isActiveBuyer ? (
                <AddToCart productId={product.id} stock={product.stock} />
              ) : auth ? (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-ink-500">
                    Beralih ke peran <strong>Pembeli</strong> untuk menambahkan
                    produk ke keranjang.
                  </p>
                  {auth.roles.includes("BUYER") ? (
                    <Link
                      href="/pilih-peran"
                      className="block rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      Ganti Peran
                    </Link>
                  ) : (
                    <p className="rounded-xl bg-ink-100 px-3 py-2 text-xs text-ink-500">
                      Akunmu belum memiliki peran Pembeli.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-ink-500">
                    Masuk atau daftar sebagai Pembeli untuk mulai berbelanja.
                    Sebagai tamu, kamu tetap bebas menjelajahi katalog.
                  </p>
                  <Link
                    href="/login"
                    className="block rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    Masuk untuk Membeli
                  </Link>
                  <Link
                    href="/register"
                    className="block rounded-xl border border-ink-200 px-4 py-2.5 text-center text-sm font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700"
                  >
                    Daftar Akun Baru
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
