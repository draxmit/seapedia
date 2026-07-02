import type { Metadata } from "next";
import { requirePageRole } from "@/server/page-guards";
import { getWallet } from "@/server/services/buyer-service";
import { formatIDR } from "@/lib/money";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TopUpForm } from "./topup-form";

export const metadata: Metadata = { title: "Dompet" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const txMeta = {
  TOPUP: { label: "Top Up", tone: "brand" as const },
  PAYMENT: { label: "Pembayaran", tone: "ink" as const },
  REFUND: { label: "Refund", tone: "sky" as const },
};

export default async function WalletPage() {
  const auth = await requirePageRole("BUYER");
  const wallet = await getWallet(auth.user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">Dompet</h1>
        <p className="mt-1 text-sm text-ink-500">
          Saldo dompet digunakan untuk membayar checkout di SEAPEDIA.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* Balance */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-7 text-white shadow-lift">
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(20rem 10rem at 85% 0%, rgb(255 255 255 / 0.4), transparent)",
              }}
            />
            <p className="relative text-sm font-medium text-brand-100">Saldo Aktif</p>
            <p className="relative mt-1 text-4xl font-extrabold tracking-tight">
              {formatIDR(wallet.balance)}
            </p>
            <p className="relative mt-3 text-xs text-brand-200">
              a/n {auth.user.name} · @{auth.user.username}
            </p>
          </div>

          {/* History */}
          <Card>
            <CardHeader
              title="Riwayat Transaksi"
              subtitle="Top up, pembayaran, dan refund tercatat di sini"
            />
            <CardBody className="p-0">
              {wallet.transactions.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="Belum ada transaksi"
                    description="Lakukan top up pertamamu untuk mulai berbelanja."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {wallet.transactions.map((tx) => (
                    <li key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                      <Badge tone={txMeta[tx.type].tone}>{txMeta[tx.type].label}</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-800">
                          {tx.note ?? txMeta[tx.type].label}
                        </p>
                        <p className="text-xs text-ink-400">{dateFmt.format(tx.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={
                            tx.amount >= 0
                              ? "text-sm font-bold text-brand-700"
                              : "text-sm font-bold text-ink-900"
                          }
                        >
                          {tx.amount >= 0 ? "+" : "−"}
                          {formatIDR(Math.abs(tx.amount))}
                        </p>
                        <p className="text-xs text-ink-400">
                          Saldo: {formatIDR(tx.balanceAfter)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Top up */}
        <aside>
          <Card className="sticky top-24">
            <CardHeader
              title="Top Up Saldo"
              subtitle="Simulasi top up — saldo langsung masuk"
            />
            <CardBody>
              <TopUpForm />
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
