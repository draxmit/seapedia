import type { Metadata } from "next";
import { requirePageRole } from "@/server/page-guards";
import { getActiveJob, listAvailableJobs } from "@/server/services/driver-service";
import { EmptyState } from "@/components/ui/empty-state";
import { JobCard } from "@/components/driver/job-card";

export const metadata: Metadata = { title: "Cari Job" };
export const dynamic = "force-dynamic";

export default async function DriverJobsPage() {
  const auth = await requirePageRole("DRIVER");
  const [available, active] = await Promise.all([
    listAvailableJobs(),
    getActiveJob(auth.user.id),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Cari Job Pengiriman
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Job muncul setelah penjual selesai memproses pesanan (Menunggu
          Pengirim). Upahmu = 100% ongkos kirim.
        </p>
      </header>

      {active && (
        <section>
          <h2 className="mb-3 text-sm font-bold tracking-wide text-sky-700 uppercase">
            Job Aktifmu
          </h2>
          <JobCard job={active} highlight />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-ink-400 uppercase">
          Job Tersedia ({available.length})
        </h2>
        {available.length === 0 ? (
          <EmptyState
            title="Belum ada job tersedia"
            description="Job baru akan muncul saat penjual selesai mengemas pesanan."
          />
        ) : (
          <div className="space-y-4">
            {available.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
