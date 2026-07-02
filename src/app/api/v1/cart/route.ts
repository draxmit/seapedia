import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { clearCart, getCart } from "@/server/services/cart-service";

export const GET = handle(async () => {
  const auth = await requireRole("BUYER");
  const cart = await getCart(auth.user.id);
  return jsonOk(cart);
});

export const DELETE = handle(async () => {
  const auth = await requireRole("BUYER");
  const cart = await clearCart(auth.user.id);
  return jsonOk(cart);
});
