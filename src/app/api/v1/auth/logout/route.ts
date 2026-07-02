import { handle, jsonOk } from "@/server/api";
import { logout } from "@/server/auth";

export const POST = handle(async () => {
  await logout();
  return jsonOk({ loggedOut: true });
});
