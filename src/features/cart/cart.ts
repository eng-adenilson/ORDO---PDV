import type { Cents, Discount, SaleProduct } from '../../types/domain.ts';
import { lineTotals } from './pricing.ts';

export interface CartItem {
  product: SaleProduct;
  qty: number; // inteiro ≥ 1
  discount: Discount | null;
  /** Saldo conhecido no momento (do servidor ou cache). Usado só para avisar; a validação final é no servidor. */
  availableQty: number | null;
}

export interface CartState { items: CartItem[]; customerId: string | null }

export type CartAction =
  | { type: 'add'; product: SaleProduct; qty?: number; availableQty: number | null }
  | { type: 'setQty'; productId: string; qty: number }
  | { type: 'remove'; productId: string }
  | { type: 'setDiscount'; productId: string; discount: Discount | null }
  | { type: 'setCustomer'; customerId: string | null }
  | { type: 'clear' };

export const emptyCart: CartState = { items: [], customerId: null };

export function cartReducer(state: CartState, a: CartAction): CartState {
  switch (a.type) {
    case 'add': {
      const qty = Math.max(1, Math.trunc(a.qty ?? 1));
      const existing = state.items.find((i) => i.product.id === a.product.id);
      if (existing) {
        return { ...state, items: state.items.map((i) => i.product.id === a.product.id ? { ...i, qty: i.qty + qty, availableQty: a.availableQty } : i) };
      }
      return { ...state, items: [...state.items, { product: a.product, qty, discount: null, availableQty: a.availableQty }] };
    }
    case 'setQty':
      return { ...state, items: state.items.map((i) => i.product.id === a.productId ? { ...i, qty: Math.max(1, Math.trunc(a.qty)) } : i) };
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.product.id !== a.productId) };
    case 'setDiscount':
      return { ...state, items: state.items.map((i) => i.product.id === a.productId ? { ...i, discount: a.discount } : i) };
    case 'setCustomer':
      return { ...state, customerId: a.customerId };
    case 'clear':
      return emptyCart;
  }
}

export interface CartSummary { gross: Cents; discount: Cents; total: Cents; units: number; overStock: CartItem[] }

export function summarize(state: CartState): CartSummary {
  let gross = 0, discount = 0, total = 0, units = 0;
  const overStock: CartItem[] = [];
  for (const i of state.items) {
    const price = i.product.price_cents ?? 0;
    const t = lineTotals(price, i.qty, i.discount);
    gross += t.gross; discount += t.discount; total += t.total; units += i.qty;
    if (i.availableQty !== null && i.qty > i.availableQty) overStock.push(i);
  }
  return { gross, discount, total, units, overStock };
}

/** Regra §3.3: não finalizar com quantidade acima do saldo. */
export function canCheckout(s: CartState): boolean {
  return s.items.length > 0 && summarize(s).overStock.length === 0;
}
