import type { Metadata } from "next";
import { requirePageRole } from "@/server/page-guards";
import { listAddresses } from "@/server/services/buyer-service";
import { AddressManager } from "./address-manager";

export const metadata: Metadata = { title: "Alamat Pengiriman" };
export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const auth = await requirePageRole("BUYER");
  const addresses = await listAddresses(auth.user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Alamat Pengiriman
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Kelola alamat tujuan pengiriman pesananmu.
        </p>
      </header>
      <AddressManager
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          recipient: a.recipient,
          phone: a.phone,
          street: a.street,
          city: a.city,
          province: a.province,
          postalCode: a.postalCode,
          isDefault: a.isDefault,
        }))}
      />
    </div>
  );
}
