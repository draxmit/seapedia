import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { cartUpdateSchema } from "@/server/validation";
import { removeCartItem, updateCartItem } from "@/server/services/cart-service";

export const PUT = handle(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("BUYER");
    const { id } = await ctx.params;
    const { quantity } = cartUpdateSchema.parse(await req.json());
    const cart = await updateCartItem(auth.user.id, id, quantity);
    return jsonOk(cart);
  },
);

export const DELETE = handle(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("BUYER");
    const { id } = await ctx.params;
    const cart = await removeCartItem(auth.user.id, id);
    return jsonOk(cart);
  },
);
