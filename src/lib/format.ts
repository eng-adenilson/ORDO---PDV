import type { Cents } from '../types/domain.ts';

const p2 = (n: number) => String(n).padStart(2, '0');

export const formatTime = (iso: string) => { const d = new Date(iso); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; };
export const formatDayMonth = (d = new Date()) => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}`;
export const formatDateTime = (iso: string) => { const d = new Date(iso); return `${formatDayMonth(d)} ${formatTime(iso)}`; };
export const formatFullDate = (iso: string) => { const d = new Date(iso); return `${formatDayMonth(d)}/${d.getFullYear()}`; };

/** (61) 9 9811-2034 — máscara enquanto digita (DDD + 9 dígitos ou 8 dígitos). */
export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2), rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (d.length === 11) return `(${ddd}) ${rest[0]} ${rest.slice(1, 5)}${rest.length > 5 ? '-' + rest.slice(5) : ''}`;
  return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

/** R$ 184,2 mil · R$ 1,3 mi — para os totalizadores do estoque (valor cheio abaixo de R$ 10 mil). */
export function formatMoneyShort(cents: Cents): string {
  const v = cents / 100;
  const br = (n: number) => n.toFixed(1).replace('.', ',').replace(/,0$/, '');
  if (Math.abs(v) >= 1_000_000) return `R$ ${br(v / 1_000_000)} mi`;
  if (Math.abs(v) >= 10_000) return `R$ ${br(v / 1_000)} mil`;
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Inicial para avatar. */
export const initial = (name: string) => (name.trim()[0] ?? '?').toUpperCase();
