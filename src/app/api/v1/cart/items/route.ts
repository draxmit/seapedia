import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { cartAddSchema } from "@/server/validation";
import { addCartItem } from "@/server/services/cart-service";

export const POST = handle(async (req: Request) => {
  const auth = await requireRole("BUYER");
  const input = cartAddSchema.parse(await req.json());
  const cart = await addCartItem(auth.user.id, input.productId, input.quantity);
  return jsonOk(cart, { status: 201 });
});
