# SEAPEDIA

SEAPEDIA is a multi-role marketplace that connects **Buyers, Sellers, and
Drivers** in one shopping ecosystem, with an **Admin** panel for monitoring and
operations. Built as a full-stack Next.js application with an API-first backend.

> One account, many roles: the same username can act as a Buyer, a Seller, and a
> Driver — choosing an active role per session — while authorization always
> follows the **active** role, not merely the roles owned.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Demo Accounts](#demo-accounts)
- [Environment Variables](#environment-variables)
- [Admin Account Setup](#admin-account-setup)
- [API Documentation](#api-documentation)
- [Business Rules](#business-rules)
  - [Single-store checkout](#single-store-checkout)
  - [Money model: discount, PPN 12%, total](#money-model-discount-ppn-12-total)
  - [Discount rule (voucher vs promo)](#discount-rule-voucher-vs-promo)
  - [Driver earning rule](#driver-earning-rule)
  - [Overdue SLA & time simulation](#overdue-sla--time-simulation)
- [Order Lifecycle](#order-lifecycle)
- [Security Notes](#security-notes)
- [End-to-End Testing Guide](#end-to-end-testing-guide)
- [Project Structure](#project-structure)
- [Deployment](#deployment)

---

## Tech Stack

| Layer     | Choice                                                            |
| --------- | ---------------------------------------------------------------- |
| Framework | **Next.js 15** (App Router) + **React 19** + **TypeScript**      |
| Styling   | **Tailwind CSS v4**, Plus Jakarta Sans                           |
| Backend   | Next.js Route Handlers — REST API under `/api/v1`                |
| Database  | **PostgreSQL** via **Prisma ORM** (parameterized queries only)   |
| Auth      | `bcryptjs` password hashing + signed **JWT session cookie** (`jose`) backed by a revocable server-side session row |
| Validation| **Zod** on every endpoint                                        |
| Docs      | OpenAPI 3.0 + Swagger UI (`/api-docs`) + Postman collection      |

The client is a web app; the backend is API-based and supports every business
flow described below.

---

## Quick Start

### Option A — Local Postgres via Docker (recommended, works on any machine)

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (Docker Desktop must be running)
docker compose up -d

# 3. Point the app at the local database
cp .env.example .env      # values already match docker-compose

# 4. Create the schema and load demo data
npx prisma migrate deploy
npx prisma db seed

# 5. Run
npm run dev
# → http://localhost:3000
```

### Option B — Any hosted Postgres (Neon, Supabase, Prisma Postgres, …)

```bash
npm install
# put your connection string in .env as DATABASE_URL, then:
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Useful scripts:

| Script             | Action                                              |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Start the dev server                                |
| `npm run build`    | Production build                                    |
| `npm run db:seed`  | (Re)load demo data                                  |
| `npm run db:reset` | Drop, re-migrate, and re-seed (destructive)         |

---

## Demo Accounts

All demo accounts share the password **`seapedia123`**.

| Username | Password     | Roles                     | Notes                              |
| -------- | ------------ | ------------------------- | ---------------------------------- |
| `admin`  | `seapedia123`| Admin                     | Monitoring, discounts, time machine|
| `budi`   | `seapedia123`| Seller                    | Store: *Elektronik Pak Budi*       |
| `rina`   | `seapedia123`| Seller                    | Store: *Dapur Bu Rina*             |
| `kurnia` | `seapedia123`| Seller                    | Store: *Kurnia Fashion*            |
| `sari`   | `seapedia123`| Seller                    | Store: *Rumah Hijau Sari*          |
| `citra`  | `seapedia123`| Buyer                     | Funded wallet, addresses, orders   |
| `rudi`   | `seapedia123`| Driver                    | Delivery history + earnings        |
| `andi`   | `seapedia123`| Seller **+** Buyer        | Multi-role                         |
| `dimas`  | `seapedia123`| Buyer **+** Driver        | Multi-role                         |
| `maya`   | `seapedia123`| Buyer **+** Seller **+** Driver | Full multi-role — shows the role picker |

> Multi-role accounts (`andi`, `dimas`, `maya`) must **choose an active role**
> after login before entering a dashboard, and can switch role any time from the
> user menu.

---

## Environment Variables

| Variable       | Required | Description                                                        |
| -------------- | -------- | ----------------------------------------------------------------- |
| `DATABASE_URL` | yes      | PostgreSQL connection string.                                     |
| `JWT_SECRET`   | yes      | Long random string used to sign session JWTs.                     |

See [`.env.example`](.env.example). Generate a secret with e.g.
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

---

## Admin Account Setup

The Admin role is **not** self-assignable at registration — it is provisioned by
the seed script (`prisma/seed.ts`) as the `admin` account. To create another
admin manually:

```bash
npx prisma studio    # open the DB browser
# 1. Create/find a User row
# 2. Add a UserRole row: { userId: <that user>, role: "ADMIN" }
```

Because an account owning the ADMIN role activates it immediately on login, the
admin never goes through the multi-role picker.

---

## API Documentation

- **Swagger UI:** run the app and open **`/api-docs`** — interactive reference
  for every endpoint.
- **OpenAPI JSON:** [`/api/openapi.json`](src/lib/openapi.ts).
- **Postman collection:** [`docs/SEAPEDIA.postman_collection.json`](docs/SEAPEDIA.postman_collection.json).
  Import it, set `{{baseUrl}}` (defaults to `http://localhost:3000/api/v1`), run
  **Auth → login**, and Postman keeps the session cookie for later requests. For
  multi-role users, call **Auth → active-role** afterward.

All responses use a consistent envelope:

```jsonc
{ "success": true,  "data":  { /* ... */ } }   // 2xx
{ "success": false, "error": "human-readable message" }   // 4xx / 5xx
```

---

## Business Rules

### Single-store checkout

A cart may contain products from **only one store** at a time. The cart locks to
the store of its first item; adding a product from a different store returns
**HTTP 409** with a clear message, and the UI offers to clear the cart first.
Implemented in [`cart-service.ts`](src/server/services/cart-service.ts) and
re-verified inside the checkout transaction.

### Money model: discount, PPN 12%, total

The discount is applied **before** PPN. For a cart:

```
taxable base = subtotal − discount
PPN (12%)    = round(taxable base × 0.12)
total        = taxable base + PPN + delivery fee
```

Delivery fees (flat, per method): **Instant Rp25.000 · Next Day Rp15.000 ·
Regular Rp8.000**. The full breakdown (subtotal, discount, delivery fee, PPN 12%,
total) is shown on the checkout summary and stored on every order.
Implemented in [`computeTotals` in `order-service.ts`](src/server/services/order-service.ts).

### Discount rule (voucher vs promo)

- **Voucher** — has an expiry date **and** a limited usage quota
  (`usedCount / maxUsage`).
- **Promo** — has an expiry date only (no quota).
- **Exactly one code per checkout.** Vouchers and promos **cannot be stacked** —
  a single code applies. This keeps the discount math unambiguous.
- Expired codes, exhausted vouchers, and codes below their minimum subtotal are
  rejected with specific messages. Percentage discounts respect an optional cap
  (`maxDiscount`) and can never exceed the subtotal.
- Expiry is evaluated against the **simulated clock**, so time-travel demos stay
  consistent.

### Driver earning rule

A driver earns **100% of the order's delivery fee**, credited when the delivery
is confirmed complete. See the earnings summary in the driver dashboard.

### Overdue SLA & time simulation

Each order gets a due day based on its delivery method, in **simulated days**
counted from checkout:

| Method    | SLA               |
| --------- | ----------------- |
| Instant   | same day (0)      |
| Next Day  | +1 day            |
| Regular   | +3 days           |

The app runs on a **virtual clock** (a day-offset stored in `AppConfig`). From
the Admin panel:

- **⏭ Simulasi Hari Berikutnya** advances the virtual clock by one day and
  immediately runs the overdue sweep.
- **Jalankan Cek Overdue** runs the sweep without moving the clock.

When an order is past its due day and still undelivered, the sweep performs an
**auto-refund**:

1. The order's total is returned to the buyer's **wallet** and recorded as a
   `REFUND` wallet transaction.
2. **Stock is restored** for each item.
3. **Seller income is reversed** (excluded from the income report) if it had
   already been counted.
4. The delivery **job is cancelled**.
5. The order moves to **Dikembalikan** with a timestamped history entry.

The refund is **idempotent by construction** — a conditional status claim means
a second sweep (or a concurrent one) can never double-refund, double-restore
stock, or double-reverse income. Implemented in
[`admin-service.ts`](src/server/services/admin-service.ts).

The seed ships one order already positioned to go overdue so the flow can be
demonstrated in a single click.

---

## Order Lifecycle

The mandated user-facing statuses, always visible in the UI:

```
Sedang Dikemas ──▶ Menunggu Pengirim ──▶ Sedang Dikirim ──▶ Pesanan Selesai
      │
      └────────────────(overdue / auto-refund)────────────▶ Dikembalikan
```

| Transition                             | Trigger                                   |
| -------------------------------------- | ----------------------------------------- |
| → Sedang Dikemas                       | Buyer checkout succeeds                    |
| Sedang Dikemas → Menunggu Pengirim     | Seller **processes** the order            |
| Menunggu Pengirim → Sedang Dikirim     | Driver **takes** the job                  |
| Sedang Dikirim → Pesanan Selesai       | Driver **confirms** delivery              |
| (any open status) → Dikembalikan       | Overdue **auto-refund** sweep             |

Every transition is written to `OrderStatusHistory` with a timestamp and actor,
and rendered as a timeline on the buyer and seller order pages.

---

## Security Notes

- **SQL Injection** — the app uses **Prisma exclusively**; all database access
  goes through Prisma's parameterized query API. There is no raw SQL anywhere in
  the codebase (verified: no `$queryRaw`/`$executeRaw`).
- **XSS** — all user-generated content (application reviews, names, comments,
  store/product text) is rendered by React, which **escapes** it; the codebase
  never uses `dangerouslySetInnerHTML` for user data. A stored `<script>` tag is
  displayed as harmless literal text. Input is additionally sanitized at the
  boundary ([`sanitize.ts`](src/server/sanitize.ts)) to strip control characters.
- **Input validation** — every endpoint validates its payload with **Zod**
  (email format, phone format, rating 1–5, quantity/price/stock ranges, discount
  values, postal code, …). Invalid input is rejected with **400** and a clear
  message; the client never dictates prices or totals.
- **Session behavior** — auth uses an **httpOnly, SameSite=Lax** session cookie
  (a signed JWT that carries only ids). The authoritative session lives in the
  database and is checked on every request, so **logout truly revokes** the
  session server-side. Sessions expire after **7 days**.
- **Role-based access control** — enforced **server-side** on every private
  endpoint via `requireRole(activeRole)`; the backend never trusts role hints
  from the UI. Authorization follows the **active** role, not the full role list.
  Resource-ownership guards prevent a seller from touching another seller's
  products, a buyer from reading another buyer's orders, or a driver from
  completing another driver's job. Admin-only endpoints reject non-admins with
  **403**. Edge middleware adds fast redirects for private routes, but the
  database-backed checks in the handlers are the source of truth.
- **HTTP headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  a restrictive `Referrer-Policy`, and a `Permissions-Policy` are set globally.

**Security test cases** (see the [testing guide](#end-to-end-testing-guide)):
posting `<script>alert('xss')</script>` as a review renders it as text;
SQL-like payloads in login/search/review forms neither authenticate nor alter
the schema.

---

## End-to-End Testing Guide

A full walkthrough that exercises every level (all with password `seapedia123`):

1. **Guest & reviews** — open `/`, browse `/products`, open a product. Submit a
   review from the landing page **without logging in**. It appears immediately.
2. **Auth & multi-role** — log in as **`maya`**; you are shown the **role
   picker** (she owns Buyer + Seller + Driver). Pick a role, then switch via the
   user menu.
3. **Seller** — as **`budi`**, open *Toko Saya* (try renaming to an existing
   store name → rejected), add/edit/delete a product, and see it in the public
   catalog.
4. **Buyer** — as **`citra`**: top up the wallet, add items from one store to the
   cart (try adding from a second store → single-store conflict), go to checkout,
   apply voucher **`HEMAT10`**, pick a delivery method, and pay. Watch subtotal /
   discount / PPN 12% / delivery / total update live. The order appears under
   *Pesanan Saya* as **Sedang Dikemas**.
5. **Seller processing** — back as **`budi`**, open the incoming order and
   **Proses Pesanan** → it becomes **Menunggu Pengirim**.
6. **Driver** — as **`rudi`**, open *Cari Job*, take the job (→ **Sedang
   Dikirim**), then confirm delivery (→ **Pesanan Selesai**). Earnings update.
7. **Admin monitoring** — as **`admin`**, review the summary and every
   monitoring table; generate a voucher and a promo.
8. **Overdue auto-refund** — still as `admin`, open **Pesanan Overdue** (the seed
   includes an order past its SLA) and click **Jalankan Cek Overdue** — the order
   becomes **Dikembalikan**, the buyer's wallet is refunded, and stock is
   restored. Or click **⏭ Simulasi Hari Berikutnya** to advance time and sweep.
9. **Security** — submit `<script>alert('xss')</script>` as a review comment
   (renders as text); try `' OR '1'='1` in the login form (rejected).

Discount codes in the seed: valid **`HEMAT10`**, **`DISKON25K`**, **`GAJIAN12`**,
**`ONGKIRHEMAT`**; expired/exhausted **`KADALUARSA`**, **`HABISPAKAI`**,
**`PROMOLALU`**.

---

## Project Structure

```
prisma/
  schema.prisma            # full domain model
  seed.ts                  # demo accounts, catalog, orders, discounts
src/
  app/
    (public)/              # landing, catalog, product/store, auth, role picker
    (buyer)/               # cart, checkout (buyer-only shell)
    (dashboard)/           # buyer/seller/driver dashboards
    admin/                 # admin panel + time machine
    api/v1/                # REST API route handlers
    api-docs/              # Swagger UI
  components/              # reusable UI, layout, product/order/driver widgets
  server/
    auth.ts                # sessions, hashing, role enforcement
    validation.ts          # Zod schemas
    sanitize.ts            # UGC sanitizer
    services/              # business logic (cart, order, discount, driver, admin…)
  lib/                     # prisma client, constants, money, virtual clock, openapi
  middleware.ts            # route protection (fast redirects)
docs/
  SEAPEDIA.postman_collection.json
```

---

## Deployment

The app is a standard Next.js project and deploys to any Node host. For a hosted
Postgres + Vercel deployment:

1. Create a Postgres database (Neon, Supabase, or Prisma Postgres) and copy its
   connection string.
2. Set `DATABASE_URL` and `JWT_SECRET` as environment variables on the host.
3. `npx prisma migrate deploy && npx prisma db seed` against the production DB.
4. Deploy (`vercel --prod` or your platform's flow).

The live deployment URL, if provisioned, is listed at the top of this section
when available.
