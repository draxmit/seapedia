import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { checkoutSchema } from "@/server/validation";
import { checkout, listBuyerOrders } from "@/server/services/order-service";

export const GET = handle(async () => {
  const auth = await requireRole("BUYER");
  const orders = await listBuyerOrders(auth.user.id);
  return jsonOk(orders);
});

/** Checkout: turns the cart into an order atomically. */
export const POST = handle(async (req: Request) => {
  const auth = await requireRole("BUYER");
  const input = checkoutSchema.parse(await req.json());
  const order = await checkout(auth.user.id, input);
  return jsonOk(order, { status: 201 });
});
