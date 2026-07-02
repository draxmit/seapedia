import { handle, jsonOk } from "@/server/api";
import { getPublicStore } from "@/server/services/product-service";

export const GET = handle(
  async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
    const { slug } = await ctx.params;
    const store = await getPublicStore(slug);
    return jsonOk(store);
  },
);
