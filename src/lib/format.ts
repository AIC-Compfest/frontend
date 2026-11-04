const idrFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Full IDR amount with en-US grouping, for example "IDR 1,379,797". */
export function formatIDR(value?: number | null): string {
  return idrFormatter.format(value ?? 0);
}

/**
 * Short IDR amount for KPI cards: "IDR 1.2B", "IDR 3.5M", "IDR 450K", or "IDR 950".
 * B stands for billion. The previous Indonesian label used "M" for billion (miliar).
 */
export function formatCompactIDR(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "IDR 0";
  if (value >= 1_000_000_000) return `IDR ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `IDR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `IDR ${(value / 1_000).toFixed(0)}K`;
  return `IDR ${value.toLocaleString("en-US")}`;
}
