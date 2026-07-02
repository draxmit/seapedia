import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { addressSchema } from "@/server/validation";
import { createAddress, listAddresses } from "@/server/services/buyer-service";

export const GET = handle(async () => {
  const auth = await requireRole("BUYER");
  const addresses = await listAddresses(auth.user.id);
  return jsonOk(addresses);
});

export const POST = handle(async (req: Request) => {
  const auth = await requireRole("BUYER");
  const input = addressSchema.parse(await req.json());
  const address = await createAddress(auth.user.id, input);
  return jsonOk(address, { status: 201 });
});
