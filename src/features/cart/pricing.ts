import type { Cents, Discount } from '../../types/domain.ts';

/** Preço unitário final após desconto do item (SPEC §5.3). Nunca negativo. */
export function unitPriceAfterDiscount(unit: Cents, d?: Discount | null): Cents {
  if (!d || d.value <= 0) return unit;
  const off = d.type === 'percent' ? Math.round((unit * Math.min(d.value, 100)) / 100) : Math.round(d.value);
  return Math.max(0, unit - off);
}

export function lineTotals(unit: Cents, qty: number, d?: Discount | null) {
  const final = unitPriceAfterDiscount(unit, d);
  return { gross: unit * qty, discount: (unit - final) * qty, total: final * qty, finalUnit: final };
}
