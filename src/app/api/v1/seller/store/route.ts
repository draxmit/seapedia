import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { storeSchema } from "@/server/validation";
import { createStore, getOwnStore, updateStore } from "@/server/services/seller-service";

export const GET = handle(async () => {
  const auth = await requireRole("SELLER");
  const store = await getOwnStore(auth.user.id);
  return jsonOk(store);
});

export const POST = handle(async (req: Request) => {
  const auth = await requireRole("SELLER");
  const input = storeSchema.parse(await req.json());
  const store = await createStore(auth.user.id, input);
  return jsonOk(store, { status: 201 });
});

export const PUT = handle(async (req: Request) => {
  const auth = await requireRole("SELLER");
  const input = storeSchema.parse(await req.json());
  const store = await updateStore(auth.user.id, input);
  return jsonOk(store);
});
