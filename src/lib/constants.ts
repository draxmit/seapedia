import type { DeliveryMethod, OrderStatus, RoleName } from "@prisma/client";

/** PPN (VAT) rate applied on the taxable base: subtotal - discount. */
export const PPN_RATE = 0.12;

/** Flat delivery fee per method, in IDR. */
export const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  INSTANT: 25000,
  NEXT_DAY: 15000,
  REGULAR: 8000,
};

/**
 * Delivery SLA in simulated days, counted from checkout day.
 * INSTANT must arrive the same day (0 extra days), NEXT_DAY within 1 day,
 * REGULAR within 3 days. An order becomes overdue when the current
 * virtual day is later than placedOnDay + SLA.
 */
export const SLA_DAYS: Record<DeliveryMethod, number> = {
  INSTANT: 0,
  NEXT_DAY: 1,
  REGULAR: 3,
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  INSTANT: "Instant",
  NEXT_DAY: "Next Day",
  REGULAR: "Reguler",
};

/** Main order lifecycle labels, as mandated by the challenge brief. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  SEDANG_DIKEMAS: "Sedang Dikemas",
  MENUNGGU_PENGIRIM: "Menunggu Pengirim",
  SEDANG_DIKIRIM: "Sedang Dikirim",
  PESANAN_SELESAI: "Pesanan Selesai",
  DIKEMBALIKAN: "Dikembalikan",
};

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: "Admin",
  SELLER: "Penjual",
  BUYER: "Pembeli",
  DRIVER: "Driver",
};

export const SESSION_COOKIE = "seapedia_session";
/** Session lifetime: 7 days. Documented in the README security notes. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
