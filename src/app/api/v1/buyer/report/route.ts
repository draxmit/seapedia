import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getBuyerReport } from "@/server/services/report-service";

export const GET = handle(async () => {
  const auth = await requireRole("BUYER");
  return jsonOk(await getBuyerReport(auth.user.id));
});
