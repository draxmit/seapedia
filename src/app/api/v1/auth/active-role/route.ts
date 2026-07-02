import { handle, jsonOk } from "@/server/api";
import { requireAuth, switchActiveRole } from "@/server/auth";
import { activeRoleSchema } from "@/server/validation";

export const POST = handle(async (req: Request) => {
  const auth = await requireAuth();
  const { role } = activeRoleSchema.parse(await req.json());
  await switchActiveRole(auth, role);
  return jsonOk({ activeRole: role });
});
