import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { productSchema } from "@/server/validation";
import { createProduct, listOwnProducts } from "@/server/services/seller-service";

export const GET = handle(async () => {
  const auth = await requireRole("SELLER");
  const products = await listOwnProducts(auth.user.id);
  return jsonOk(products);
});

export const POST = handle(async (req: Request) => {
  const auth = await requireRole("SELLER");
  const input = productSchema.parse(await req.json());
  const product = await createProduct(auth.user.id, input);
  return jsonOk(product, { status: 201 });
});
