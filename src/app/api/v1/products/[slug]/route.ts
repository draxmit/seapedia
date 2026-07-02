import { handle, jsonOk } from "@/server/api";
import { getPublicProduct } from "@/server/services/product-service";

export const GET = handle(
  async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
    const { slug } = await ctx.params;
    const product = await getPublicProduct(slug);
    return jsonOk(product);
  },
);
