import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { topUpSchema } from "@/server/validation";
import { topUpWallet } from "@/server/services/buyer-service";

export const POST = handle(async (req: Request) => {
  const auth = await requireRole("BUYER");
  const { amount } = topUpSchema.parse(await req.json());
  const wallet = await topUpWallet(auth.user.id, amount);
  return jsonOk(wallet, { status: 201 });
});
