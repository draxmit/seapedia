/** Format an integer amount of rupiah as "Rp12.500". */
export function formatIDR(amount: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID").format(amount);
}
