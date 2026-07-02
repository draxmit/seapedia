import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";
import { getFinancialSummary } from "@/server/services/finance-service";
import { ROLE_LABELS } from "@/lib/constants";
import { formatIDR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  const finance = await getFinancialSummary(auth.user.id, auth.roles);

  const financialCards = [
    auth.roles.includes("BUYER") && {
      label: "Saldo Dompet",
      role: "Pembeli",
      value: finance.walletBalance ?? 0,
      href: "/dashboard/wallet",
      cta: "Kelola dompet",
    },
    auth.roles.includes("SELLER") && {
      label: "Pendapatan Toko",
      role: "Penjual",
      value: finance.sellerIncome ?? 0,
      href: "/dashboard/seller/income",
      cta: "Lihat laporan",
    },
    auth.roles.includes("DRIVER") && {
      label: "Penghasilan Driver",
      role: "Driver",
      value: finance.driverEarnings ?? 0,
      href: "/dashboard/driver/history",
      cta: "Lihat riwayat",
    },
  ].filter(Boolean) as Array<{
    label: string;
    role: string;
    value: number;
    href: string;
    cta: string;
  }>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Halo, {auth.user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Kamu sedang menggunakan peran{" "}
          <strong className="text-brand-700">
            {auth.activeRole ? ROLE_LABELS[auth.activeRole] : "-"}
          </strong>
          . Ringkasan akunmu ada di bawah ini.
        </p>
      </header>

      {/* Financial summary across owned roles */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {financialCards.map((card) => (
          <Card key={card.label} className="relative overflow-hidden">
            <CardBody>
              <p className="flex items-center justify-between text-xs font-semibold text-ink-500">
                {card.label}
                <Badge tone="ink">{card.role}</Badge>
              </p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
                {formatIDR(card.value)}
              </p>
              <Link
                href={card.href}
                className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                {card.cta} →
              </Link>
            </CardBody>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader title="Profil Akun" subtitle="Data akun SEAPEDIA milikmu" />
          <CardBody>
            <dl className="space-y-3 text-sm">
              <ProfileRow label="Nama" value={auth.user.name} />
              <ProfileRow label="Username" value={`@${auth.user.username}`} />
              <ProfileRow label="Email" value={auth.user.email} />
              <ProfileRow label="No. HP" value={auth.user.phone ?? "—"} />
            </dl>
          </CardBody>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader
            title="Peran Akun"
            subtitle="Peran yang dimiliki dan peran aktif sesi ini"
            action={
              auth.roles.filter((r) => r !== "ADMIN").length > 1 ? (
                <Link
                  href="/pilih-peran"
                  className="text-xs font-bold text-brand-700 hover:text-brand-800"
                >
                  Ganti Peran
                </Link>
              ) : undefined
            }
          />
          <CardBody>
            <ul className="space-y-2.5">
              {auth.roles.map((role) => (
                <li
                  key={role}
                  className="flex items-center justify-between rounded-xl bg-stone-50 px-3.5 py-2.5 ring-1 ring-ink-950/5"
                >
                  <span className="text-sm font-semibold text-ink-800">
                    {ROLE_LABELS[role]}
                  </span>
                  {role === auth.activeRole ? (
                    <Badge tone="brand">Peran Aktif</Badge>
                  ) : (
                    <span className="text-xs text-ink-400">Dimiliki</span>
                  )}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="truncate font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
