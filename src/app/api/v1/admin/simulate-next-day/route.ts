import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { simulateNextDay } from "@/server/services/admin-service";

/**
 * Time simulation trigger: advances the virtual clock by one day and
 * immediately runs the overdue sweep, so SLA violations become
 * demonstrable without waiting for real days.
 */
export const POST = handle(async () => {
  await requireRole("ADMIN");
  return jsonOk(await simulateNextDay());
});
