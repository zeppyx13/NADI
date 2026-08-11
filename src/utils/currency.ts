export const budgetConfig = {
  min: 100_000,
  max: 10_000_000,
  step: 100_000,
  defaultMin: 500_000,
  defaultMax: 2_000_000,
} as const;

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactIdr(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `Rp${Number.isInteger(millions) ? millions : millions.toFixed(1)} jt`;
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    return `Rp${Number.isInteger(thousands) ? thousands : thousands.toFixed(0)} rb`;
  }
  return formatIdr(amount);
}
