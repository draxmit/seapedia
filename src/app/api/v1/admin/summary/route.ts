import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getAdminSummary, getClock } from "@/server/services/admin-service";

export const GET = handle(async () => {
  await requireRole("ADMIN");
  const [summary, clock] = await Promise.all([getAdminSummary(), getClock()]);
  return jsonOk({ ...summary, clock });
});
