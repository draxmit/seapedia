import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuth } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProductForm } from "@/components/product/product-form";

export const metadata: Metadata = { title: "Ubah Produk" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  const { id } = await params;

  // Ownership enforced in the query itself: only own, non-deleted products
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null, store: { ownerId: auth.user.id } },
  });
  if (!product) notFound();

  return (
    <Card>
      <CardHeader title="Ubah Produk" subtitle={product.name} />
      <CardBody>
        <ProductForm
          productId={product.id}
          initial={{
            name: product.name,
            description: product.description,
            price: String(product.price),
            stock: String(product.stock),
            imageUrl: product.imageUrl ?? "",
            category: product.category ?? "",
          }}
        />
      </CardBody>
    </Card>
  );
}
