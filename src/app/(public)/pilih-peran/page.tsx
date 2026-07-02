import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";
import { RolePicker } from "./role-picker";

export const metadata: Metadata = { title: "Pilih Peran" };
export const dynamic = "force-dynamic";

/**
 * Multi-role gate: a user owning several non-admin roles must choose the
 * active role for this session before entering any private dashboard.
 */
export default async function ChooseRolePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  const { next } = await searchParams;
  const selectable = auth.roles.filter((r) => r !== "ADMIN");

  // Nothing to choose: admins and single-role users skip this page
  if (auth.roles.includes("ADMIN")) redirect("/admin");
  if (selectable.length <= 1) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-center text-2xl font-extrabold tracking-tight text-ink-950">
        Halo, {auth.user.name.split(" ")[0]}! Masuk sebagai siapa hari ini?
      </h1>
      <p className="mt-2 text-center text-sm text-ink-500">
        Akunmu memiliki {selectable.length} peran. Pilih peran aktif untuk sesi
        ini — kamu bisa berganti kapan saja.
      </p>
      <div className="mt-10">
        <RolePicker
          roles={selectable}
          current={auth.activeRole}
          nextPath={next}
        />
      </div>
    </div>
  );
}
