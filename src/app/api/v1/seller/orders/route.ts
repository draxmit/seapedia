import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { listSellerOrders } from "@/server/services/order-service";

export const GET = handle(async () => {
  const auth = await requireRole("SELLER");
  const orders = await listSellerOrders(auth.user.id);
  return jsonOk(orders);
});
