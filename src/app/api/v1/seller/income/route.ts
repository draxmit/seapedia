import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getSellerReport } from "@/server/services/report-service";

export const GET = handle(async () => {
  const auth = await requireRole("SELLER");
  return jsonOk(await getSellerReport(auth.user.id));
});
