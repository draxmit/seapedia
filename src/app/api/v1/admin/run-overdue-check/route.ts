import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { runOverdueSweep } from "@/server/services/admin-service";

/** Manual overdue sweep without moving the clock. Idempotent. */
export const POST = handle(async () => {
  await requireRole("ADMIN");
  return jsonOk(await runOverdueSweep());
});
