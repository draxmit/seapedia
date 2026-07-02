import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getSellerOrder } from "@/server/services/order-service";

export const GET = handle(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("SELLER");
    const { id } = await ctx.params;
    const order = await getSellerOrder(auth.user.id, id);
    return jsonOk(order);
  },
);
