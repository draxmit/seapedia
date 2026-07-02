import type { Metadata } from "next";
import Link from "next/link";
import { requirePageRole } from "@/server/page-guards";
import { getCart } from "@/server/services/cart-service";
import { formatIDR } from "@/lib/money";
import { EmptyState } from "@/components/ui/empty-state";
import { CartItems } from "./cart-items";

export const metadata: Metadata = { title: "Keranjang" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const auth = await requirePageRole("BUYER");
  const cart = await getCart(auth.user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Keranjang Belanja
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Satu keranjang berisi produk dari satu toko — checkout dilakukan per
          toko.
        </p>
      </header>

      {cart.items.length === 0 ? (
        <EmptyState
          title="Keranjangmu masih kosong"
          description="Jelajahi katalog dan temukan produk favoritmu."
          action={
            <Link
              href="/products"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Jelajahi Produk
            </Link>
          }
        />
      ) : (
        <CartItems
          storeName={cart.store!.name}
          storeSlug={cart.store!.slug}
          subtotal={cart.subtotal}
          items={cart.items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            product: {
              name: i.product.name,
              slug: i.product.slug,
              price: i.product.price,
              stock: i.product.stock,
              imageUrl: i.product.imageUrl,
            },
          }))}
        />
      )}

      {cart.items.length > 0 && (
        <p className="mt-6 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900 ring-1 ring-brand-600/10">
          <strong>Aturan satu toko:</strong> keranjang ini terkunci untuk toko{" "}
          <strong>{cart.store!.name}</strong> ({formatIDR(cart.subtotal)}).
          Untuk membeli dari toko lain, selesaikan checkout ini atau kosongkan
          keranjang terlebih dahulu.
        </p>
      )}
    </div>
  );
}
