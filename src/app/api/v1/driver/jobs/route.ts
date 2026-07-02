import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getActiveJob, listAvailableJobs } from "@/server/services/driver-service";

export const GET = handle(async () => {
  const auth = await requireRole("DRIVER");
  const [available, active] = await Promise.all([
    listAvailableJobs(),
    getActiveJob(auth.user.id),
  ]);
  return jsonOk({ available, active });
});
