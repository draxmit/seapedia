import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getWallet } from "@/server/services/buyer-service";

export const GET = handle(async () => {
  const auth = await requireRole("BUYER");
  const wallet = await getWallet(auth.user.id);
  return jsonOk(wallet);
});
