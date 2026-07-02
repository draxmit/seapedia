import type { Metadata } from "next";
import Link from "next/link";
import { requirePageRole } from "@/server/page-guards";
import { getDriverHistory } from "@/server/services/driver-service";
import { formatIDR } from "@/lib/money";
import { DELIVERY_METHOD_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Riwayat & Penghasilan" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const jobStatusMeta = {
  AVAILABLE: { text: "Tersedia", tone: "ink" as const },
  TAKEN: { text: "Diantar", tone: "sky" as const },
  COMPLETED: { text: "Selesai", tone: "brand" as const },
  CANCELLED: { text: "Dibatalkan", tone: "red" as const },
};

export default async function DriverHistoryPage() {
  const auth = await requirePageRole("DRIVER");
  const { jobs, summary } = await getDriverHistory(auth.user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Riwayat & Penghasilan
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Upah driver = 100% ongkos kirim pesanan, dihitung saat pengiriman
          selesai.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lift">
          <p className="text-xs font-semibold text-brand-100">Total Penghasilan</p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight">
            {formatIDR(summary.totalEarnings)}
          </p>
          <p className="mt-1 text-xs text-brand-200">
            dari {summary.completedJobs} pengantaran selesai
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <p className="text-xs font-semibold text-ink-500">Job Aktif</p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight text-ink-950">
            {summary.activeJobs}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <p className="text-xs font-semibold text-ink-500">Total Job Diambil</p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight text-ink-950">
            {summary.totalJobs}
          </p>
        </div>
      </section>

      <Card>
        <CardHeader title="Riwayat Job" subtitle="Semua job yang pernah kamu ambil" />
        <CardBody className="p-0">
          {jobs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Belum ada job"
                description="Ambil job pertamamu di halaman Cari Job."
                action={
                  <Link
                    href="/dashboard/driver/jobs"
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Cari Job
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/dashboard/driver/jobs/${job.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-stone-50/60"
                  >
                    <Badge tone={jobStatusMeta[job.status].tone}>
                      {jobStatusMeta[job.status].text}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-bold text-ink-900">
                        {job.order.code}
                      </p>
                      <p className="text-xs text-ink-500">
                        {job.order.store.name} →{" "}
                        {job.order.recipient} ·{" "}
                        {DELIVERY_METHOD_LABELS[job.order.deliveryMethod]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-brand-700">
                        {formatIDR(job.fee)}
                      </p>
                      <p className="text-xs text-ink-400">
                        {job.completedAt
                          ? dateFmt.format(job.completedAt)
                          : job.takenAt
                            ? `Diambil ${dateFmt.format(job.takenAt)}`
                            : dateFmt.format(job.createdAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
