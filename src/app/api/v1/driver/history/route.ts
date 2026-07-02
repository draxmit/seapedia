import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getDriverHistory } from "@/server/services/driver-service";

export const GET = handle(async () => {
  const auth = await requireRole("DRIVER");
  const history = await getDriverHistory(auth.user.id);
  return jsonOk(history);
});
