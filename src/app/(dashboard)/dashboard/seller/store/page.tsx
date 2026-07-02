import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";
import { getOwnStore } from "@/server/services/seller-service";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StoreForm } from "./store-form";

export const metadata: Metadata = { title: "Toko Saya" };
export const dynamic = "force-dynamic";

export default async function SellerStorePage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  const store = await getOwnStore(auth.user.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
            Toko Saya
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {store
              ? "Perbarui profil toko yang tampil ke pembeli."
              : "Buat identitas tokomu — nama toko harus unik di seluruh SEAPEDIA."}
          </p>
        </div>
        {store && (
          <Link
            href={`/stores/${store.slug}`}
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Lihat halaman publik toko →
          </Link>
        )}
      </header>

      {store && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-ink-500">Nama Toko</p>
              <p className="mt-1 truncate text-lg font-extrabold text-ink-950">
                {store.name}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-ink-500">Produk Aktif</p>
              <p className="mt-1 text-lg font-extrabold text-ink-950">
                {store._count.products}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-ink-500">Kota</p>
              <p className="mt-1 truncate text-lg font-extrabold text-ink-950">
                {store.city ?? "—"}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader
          title={store ? "Perbarui Profil Toko" : "Buat Toko Baru"}
          subtitle="Nama toko wajib unik — sistem akan menolak nama yang sudah dipakai"
        />
        <CardBody>
          <StoreForm
            initial={
              store
                ? {
                    name: store.name,
                    description: store.description ?? "",
                    city: store.city ?? "",
                  }
                : null
            }
          />
        </CardBody>
      </Card>
    </div>
  );
}
