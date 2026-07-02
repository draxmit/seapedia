import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { listUsersAdmin } from "@/server/services/admin-service";

export const GET = handle(async () => {
  await requireRole("ADMIN");
  const users = await listUsersAdmin();
  // Strip password hashes from the payload
  return jsonOk(
    users.map(({ passwordHash: _ph, ...user }) => user),
  );
});
