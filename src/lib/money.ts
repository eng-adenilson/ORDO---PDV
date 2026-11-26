import type { Cents } from '@/types/domain';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 45632 → "R$ 456,32". Use sempre isto — nunca formate dinheiro à mão. */
export function formatMoney(cents: Cents): string {
  return fmt.format(cents / 100).replace(/ /g, ' ');
}

/** "R$ 1.240,00" | "1240,5" | "89.90" → centavos. Retorna null se inválido. */
export function parseMoney(input: string): Cents | null {
  const s = input.replace(/[R$\s]/g, '');
  if (!s) return null;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}
