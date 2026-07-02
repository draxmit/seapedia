import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { checkoutQuoteSchema } from "@/server/validation";
import { quoteCheckout } from "@/server/services/order-service";

/** Prices the current cart: subtotal, discount, PPN 12%, delivery fee, total. */
export const POST = handle(async (req: Request) => {
  const auth = await requireRole("BUYER");
  const input = checkoutQuoteSchema.parse(await req.json());
  const quote = await quoteCheckout(auth.user.id, input.deliveryMethod, input.discountCode);
  return jsonOk(quote);
});
