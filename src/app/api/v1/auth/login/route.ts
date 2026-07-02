import { handle, jsonOk } from "@/server/api";
import { loginSchema } from "@/server/validation";
import { loginUser } from "@/server/services/auth-service";

export const POST = handle(async (req: Request) => {
  const input = loginSchema.parse(await req.json());
  const { user, roles, activeRole } = await loginUser(input);
  return jsonOk({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    roles,
    activeRole,
    needsRoleSelection: activeRole === null,
  });
});
