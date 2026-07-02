import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/server/page-guards";
import { getJobDetail } from "@/server/services/driver-service";
import { ApiError } from "@/server/api";
import { formatIDR } from "@/lib/money";
import { DELIVERY_METHOD_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { JobActions } from "./job-actions";

export const metadata: Metadata = { title: "Detail Job" };
export const dynamic = "force-dynamic";

const jobStatusLabel = {
  AVAILABLE: { text: "Tersedia", tone: "brand" as const },
  TAKEN: { text: "Sedang Diantar", tone: "sky" as const },
  COMPLETED: { text: "Selesai", tone: "brand" as const },
  CANCELLED: { text: "Dibatalkan", tone: "red" as const },
};

export default async function DriverJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requirePageRole("DRIVER");
  const { id } = await params;

  let job;
  try {
    job = await getJobDetail(auth.user.id, id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const isMine = job.driverId === auth.user.id;
  const meta = jobStatusLabel[job.status];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-xl font-extrabold tracking-tight text-ink-950">
              {job.order.code}
            </h1>
            <Badge tone={meta.tone}>{meta.text}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {DELIVERY_METHOD_LABELS[job.order.deliveryMethod]} · Upah{" "}
            <strong className="text-brand-700">{formatIDR(job.fee)}</strong>
          </p>
        </div>
        <Link
          href="/dashboard/driver/jobs"
          className="text-sm font-semibold text-ink-500 hover:text-ink-800"
        >
          ← Daftar Job
        </Link>
      </header>

      <JobActions
        jobId={job.id}
        status={job.status}
        isMine={isMine}
        fee={job.fee}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Titik Jemput (A)" subtitle="Ambil paket dari toko" />
          <CardBody>
            <p className="text-sm font-bold text-ink-900">{job.order.store.name}</p>
            <p className="mt-1 text-sm text-ink-500">
              {job.order.store.city ?? "Kota tidak dicantumkan"}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Titik Antar (B)" subtitle="Serahkan ke penerima" />
          <CardBody>
            <p className="text-sm font-bold text-ink-900">{job.order.recipient}</p>
            <p className="text-sm text-ink-600">{job.order.phone}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              {job.order.fullAddress}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Isi Paket" />
        <CardBody>
          <ul className="space-y-2">
            {job.order.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-ink-700">{item.productName}</span>
                <span className="font-semibold text-ink-900">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
