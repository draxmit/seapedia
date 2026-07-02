import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { productSchema } from "@/server/validation";
import { deleteProduct, updateProduct } from "@/server/services/seller-service";

export const PUT = handle(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("SELLER");
    const { id } = await ctx.params;
    const input = productSchema.parse(await req.json());
    const product = await updateProduct(auth.user.id, id, input);
    return jsonOk(product);
  },
);

export const DELETE = handle(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("SELLER");
    const { id } = await ctx.params;
    await deleteProduct(auth.user.id, id);
    return jsonOk({ deleted: true });
  },
);
