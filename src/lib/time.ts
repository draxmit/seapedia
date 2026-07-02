import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * SEAPEDIA runs on a simulated clock so delivery SLAs can be demonstrated
 * without waiting for real days to pass. The virtual "now" is the real time
 * shifted forward by `virtualDayOffset` days (AppConfig, single row).
 * Admins advance the clock with the "Simulasi Hari Berikutnya" action.
 */
export async function getVirtualDayOffset(): Promise<number> {
  const config = await prisma.appConfig.findUnique({ where: { id: 1 } });
  return config?.virtualDayOffset ?? 0;
}

export async function getVirtualNow(): Promise<Date> {
  const offset = await getVirtualDayOffset();
  return new Date(Date.now() + offset * DAY_MS);
}

/** Day number (UTC) for a given date — used for SLA comparisons. */
export function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

export async function getCurrentVirtualDay(): Promise<number> {
  return dayNumber(await getVirtualNow());
}

/** Advance the simulated clock by one day and return the new offset. */
export async function advanceVirtualDay(): Promise<number> {
  const config = await prisma.appConfig.upsert({
    where: { id: 1 },
    create: { id: 1, virtualDayOffset: 1 },
    update: { virtualDayOffset: { increment: 1 } },
  });
  return config.virtualDayOffset;
}
