import { handle, jsonOk } from "@/server/api";
import { requireAuth } from "@/server/auth";
import { toProfile } from "@/server/services/auth-service";

export const GET = handle(async () => {
  const auth = await requireAuth();
  return jsonOk(toProfile(auth));
});
