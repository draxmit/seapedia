import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/server/page-guards";
import { getCart } from "@/server/services/cart-service";
import { listAddresses, getWallet } from "@/server/services/buyer-service";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const auth = await requirePageRole("BUYER");
  const [cart, addresses, wallet] = await Promise.all([
    getCart(auth.user.id),
    listAddresses(auth.user.id),
    getWallet(auth.user.id),
  ]);

  if (cart.items.length === 0) redirect("/cart");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Pesanan dari toko <strong>{cart.store!.name}</strong> — periksa
          rincian sebelum membayar.
        </p>
      </header>

      {addresses.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 px-5 py-4 ring-1 ring-amber-600/20">
          <p className="text-sm font-semibold text-amber-900">
            Kamu belum punya alamat pengiriman.
          </p>
          <Link
            href="/dashboard/addresses"
            className="mt-2 inline-block rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Tambah Alamat Dulu
          </Link>
        </div>
      ) : (
        <CheckoutClient
          walletBalance={wallet.balance}
          addresses={addresses.map((a) => ({
            id: a.id,
            label: a.label,
            recipient: a.recipient,
            phone: a.phone,
            summary: `${a.street}, ${a.city}, ${a.province} ${a.postalCode}`,
            isDefault: a.isDefault,
          }))}
          items={cart.items.map((i) => ({
            id: i.id,
            name: i.product.name,
            imageUrl: i.product.imageUrl,
            price: i.product.price,
            quantity: i.quantity,
          }))}
        />
      )}
    </div>
  );
}
