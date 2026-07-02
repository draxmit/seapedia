import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";
import { getOwnStore } from "@/server/services/seller-service";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductForm } from "@/components/product/product-form";

export const metadata: Metadata = { title: "Tambah Produk" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  const store = await getOwnStore(auth.user.id);

  if (!store) {
    return (
      <EmptyState
        title="Kamu belum memiliki toko"
        description="Buat toko terlebih dahulu sebelum menambahkan produk."
        action={
          <Link
            href="/dashboard/seller/store"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Buat Toko
          </Link>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader
        title="Tambah Produk Baru"
        subtitle={`Produk akan tampil di katalog publik atas nama ${store.name}`}
      />
      <CardBody>
        <ProductForm />
      </CardBody>
    </Card>
  );
}
