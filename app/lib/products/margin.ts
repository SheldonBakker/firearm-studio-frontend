export function marginAmount(price: number, cost: number | null): number | null {
  if (cost === null) return null;
  return price - cost;
}

export function marginPercent(
  price: number,
  cost: number | null,
): number | null {
  if (cost === null || price === 0) return null;
  return ((price - cost) / price) * 100;
}

export function fmtMarginPercent(price: number, cost: number | null): string {
  const pct = marginPercent(price, cost);
  if (pct === null) return "";
  return `${pct.toFixed(1)}%`;
}
