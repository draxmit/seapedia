import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";

const jobInclude = {
  order: {
    include: {
      store: { select: { name: true, slug: true, city: true } },
      items: { select: { productName: true, quantity: true } },
    },
  },
};

/**
 * Jobs a driver may take: only orders the seller has processed
 * (Menunggu Pengirim). Orders still being packed never appear here.
 */
export async function listAvailableJobs() {
  return prisma.deliveryJob.findMany({
    where: { status: "AVAILABLE", order: { status: "MENUNGGU_PENGIRIM" } },
    include: jobInclude,
    orderBy: { createdAt: "asc" },
  });
}

/** The driver's current active (taken, not yet completed) job, if any. */
export async function getActiveJob(driverId: string) {
  return prisma.deliveryJob.findFirst({
    where: { driverId, status: "TAKEN" },
    include: jobInclude,
  });
}

/** Job detail: visible when still available or when owned by this driver. */
export async function getJobDetail(driverId: string, jobId: string) {
  const job = await prisma.deliveryJob.findFirst({
    where: {
      id: jobId,
      OR: [{ status: "AVAILABLE" }, { driverId }],
    },
    include: jobInclude,
  });
  if (!job) throw new ApiError(404, "Job pengiriman tidak ditemukan");
  return job;
}

/**
 * Take a job. One order has exactly one active driver: the conditional
 * update only succeeds while the job is still AVAILABLE and unassigned,
 * so two drivers can never win the same job.
 */
export async function takeJob(driverId: string, jobId: string) {
  const active = await getActiveJob(driverId);
  if (active) {
    throw new ApiError(400, "Selesaikan job aktifmu dulu sebelum mengambil job baru");
  }

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.deliveryJob.updateMany({
      where: { id: jobId, status: "AVAILABLE", driverId: null },
      data: { driverId, status: "TAKEN", takenAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new ApiError(409, "Job ini sudah diambil driver lain");
    }

    const job = await tx.deliveryJob.findUnique({ where: { id: jobId } });
    await tx.order.update({
      where: { id: job!.orderId },
      data: { status: "SEDANG_DIKIRIM" },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: job!.orderId,
        status: "SEDANG_DIKIRIM",
        note: "Driver mengambil pesanan dan sedang dalam perjalanan",
        actor: "driver",
      },
    });

    return tx.deliveryJob.findUnique({ where: { id: jobId }, include: jobInclude });
  });
}

/**
 * Confirm delivery. Completes the job, moves the order to Pesanan Selesai,
 * and marks seller income as counted. Only the assigned driver may confirm,
 * and only once (guarded update).
 */
export async function completeJob(driverId: string, jobId: string) {
  return prisma.$transaction(async (tx) => {
    const done = await tx.deliveryJob.updateMany({
      where: { id: jobId, driverId, status: "TAKEN" },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    if (done.count === 0) {
      throw new ApiError(400, "Job ini bukan milikmu atau sudah selesai");
    }

    const job = await tx.deliveryJob.findUnique({ where: { id: jobId } });
    await tx.order.update({
      where: { id: job!.orderId },
      data: { status: "PESANAN_SELESAI", incomeCounted: true },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: job!.orderId,
        status: "PESANAN_SELESAI",
        note: "Pesanan diterima pembeli — pengiriman selesai",
        actor: "driver",
      },
    });

    return tx.deliveryJob.findUnique({ where: { id: jobId }, include: jobInclude });
  });
}

/**
 * Job history + earnings. Earning rule (documented in the README):
 * the driver receives 100% of the order's delivery fee on completion.
 */
export async function getDriverHistory(driverId: string) {
  const jobs = await prisma.deliveryJob.findMany({
    where: { driverId },
    include: jobInclude,
    orderBy: { createdAt: "desc" },
  });
  const completed = jobs.filter((j) => j.status === "COMPLETED");
  return {
    jobs,
    summary: {
      totalJobs: jobs.length,
      completedJobs: completed.length,
      activeJobs: jobs.filter((j) => j.status === "TAKEN").length,
      totalEarnings: completed.reduce((s, j) => s + j.fee, 0),
    },
  };
}
