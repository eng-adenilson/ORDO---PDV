import type { Product } from '../../types/domain.ts';

/** Avisa a lista de Produtos que um produto foi salvo, para mostrar o toast "Produto salvo · <nome>" (R8). */
let last: Product | null = null;
export function notifyProductSaved(p: Product) { last = p; }
export function takeSavedProduct(): Product | null { const p = last; last = null; return p; }
