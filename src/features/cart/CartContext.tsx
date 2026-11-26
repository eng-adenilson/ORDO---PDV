import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { cartReducer, emptyCart, summarize, type CartAction, type CartState, type CartSummary } from './cart';

const Ctx = createContext<{ state: CartState; dispatch: (a: CartAction) => void; summary: CartSummary } | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, emptyCart);
  const summary = useMemo(() => summarize(state), [state]);
  return <Ctx.Provider value={{ state, dispatch, summary }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart fora do CartProvider');
  return v;
}
