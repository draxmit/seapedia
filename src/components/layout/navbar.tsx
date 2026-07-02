import Link from "next/link";
import { getAuth } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/layout/logo";
import { MobileMenu, SearchBar, UserMenu } from "@/components/layout/navbar-client";

/**
 * Top navigation. Guests see Masuk/Daftar; logged-in users see their
 * role-aware menu. Buyers additionally get the cart shortcut with a live
 * item count — private actions never leak to guests.
 */
export async function Navbar() {
  const auth = await getAuth();

  let cartCount = 0;
  if (auth?.activeRole === "BUYER") {
    const items = await prisma.cartItem.findMany({
      where: { cart: { userId: auth.user.id } },
      select: { quantity: true },
    });
    cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-8">
        <Logo />

        <SearchBar className="hidden max-w-xl flex-1 md:block" />

        <nav className="ml-auto flex items-center gap-2">
          <Link
            href="/products"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 md:block"
          >
            Jelajah
          </Link>

          {auth?.activeRole === "BUYER" && (
            <Link
              href="/cart"
              aria-label="Keranjang"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 transition-colors hover:bg-ink-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.635a1.125 1.125 0 011.096.874L5.4 5.25m0 0l1.464 6.59a1.875 1.875 0 001.83 1.472h7.905a1.875 1.875 0 001.83-1.437l1.32-5.5A1.125 1.125 0 0018.656 5.25H5.4zM8.25 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm9 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}

          {auth ? (
            <UserMenu
              user={{
                name: auth.user.name,
                username: auth.user.username,
                roles: auth.roles,
                activeRole: auth.activeRole,
              }}
            />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-800 transition-colors hover:border-brand-400 hover:text-brand-700"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700"
              >
                Daftar
              </Link>
            </div>
          )}

          <MobileMenu
            user={
              auth
                ? {
                    name: auth.user.name,
                    username: auth.user.username,
                    roles: auth.roles,
                    activeRole: auth.activeRole,
                  }
                : null
            }
          />
        </nav>
      </div>
    </header>
  );
}
