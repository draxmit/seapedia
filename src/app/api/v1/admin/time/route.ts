import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getClock } from "@/server/services/admin-service";

export const GET = handle(async () => {
  await requireRole("ADMIN");
  return jsonOk(await getClock());
});
