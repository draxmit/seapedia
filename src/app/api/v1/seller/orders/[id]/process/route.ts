import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { processOrder } from "@/server/services/order-service";

/** Seller: Sedang Dikemas -> Menunggu Pengirim (+ delivery job for drivers). */
export const POST = handle(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("SELLER");
    const { id } = await ctx.params;
    const order = await processOrder(auth.user.id, id);
    return jsonOk(order);
  },
);
