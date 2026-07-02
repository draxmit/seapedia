import { handle, jsonOk } from "@/server/api";
import { registerSchema } from "@/server/validation";
import { registerUser } from "@/server/services/auth-service";

export const POST = handle(async (req: Request) => {
  const input = registerSchema.parse(await req.json());
  const { user, roles, activeRole } = await registerUser(input);
  return jsonOk(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roles,
      activeRole,
      needsRoleSelection: activeRole === null,
    },
    { status: 201 },
  );
});
