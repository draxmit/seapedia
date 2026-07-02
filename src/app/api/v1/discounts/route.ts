import { handle, jsonOk } from "@/server/api";
import { listActiveDiscounts } from "@/server/services/discount-service";

/** Public: currently usable vouchers and promos (for the checkout UI). */
export const GET = handle(async () => {
  return jsonOk(await listActiveDiscounts());
});
