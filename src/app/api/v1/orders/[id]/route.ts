import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getBuyerOrder } from "@/server/services/order-service";

export const GET = handle(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("BUYER");
    const { id } = await ctx.params;
    const order = await getBuyerOrder(auth.user.id, id);
    return jsonOk(order);
  },
);
