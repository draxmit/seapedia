import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { listOrdersAdmin } from "@/server/services/admin-service";

export const GET = handle(async () => {
  await requireRole("ADMIN");
  return jsonOk(await listOrdersAdmin());
});
