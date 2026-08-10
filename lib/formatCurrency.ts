/**
 * Shared currency formatting utility.
 * Always formats as Tunisian Dinar (TND) using the fr-TN locale.
 *
 * Output examples:
 *   149900  →  "149 900,000 TND"
 *   90      →  "90,000 TND"
 *   0       →  "0,000 TND"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
  }).format(amount)
}
