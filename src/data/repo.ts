/**
 * Acesso a dados. TODA tela usa estas funções — nunca chame supabase direto de um componente.
 * Modo demo (sem .env) usa src/data/demo.ts; modo real usa Supabase + fila offline.
 */
import NetInfo from '@react-native-community/netinfo';
import { randomUUID } from 'expo-crypto';
import { isDemo } from '@/lib/env';
import { enqueue } from '@/lib/offline/outbox';
import { supabase } from '@/lib/supabase';
import { searchTokens } from '@/lib/voice/parseQuery';
import { summarize, type CartState } from '@/features/cart/cart';
import type { PaymentMethod, SaleProduct } from '@/types/domain';
import { demoCategories, demoProducts } from './demo';

const toSaleProduct = ({ id, code, name, photo_url, price_cents, category_id }: SaleProduct): SaleProduct =>
  ({ id, code, name, photo_url, price_cents, category_id });

/** Lista para a grade da tela de vendas (sem custo, sem estoque — §2.2 do documento). */
export async function listSaleProducts(categoryId?: string | null): Promise<SaleProduct[]> {
  if (isDemo) return demoProducts.filter((p) => p.active && (!categoryId || p.category_id === categoryId)).map(toSaleProduct);
  let q = supabase.from('sale_products').select('*').order('name').limit(60);
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q;
  if (error) throw error;
  return data as SaleProduct[];
}

/** Busca por nome/código conforme digita e pela voz. Todos os termos precisam aparecer (AND). */
export async function searchProducts(query: string): Promise<SaleProduct[]> {
  const toks = searchTokens(query);
  if (!toks.length) return [];
  if (isDemo) {
    return demoProducts.filter((p) => p.active).filter((p) => {
      const hay = searchTokens(`${p.name} ${p.code}`).join(' ');
      return toks.every((t) => hay.includes(t));
    }).map(toSaleProduct);
  }
  const { data, error } = await supabase.rpc('search_products', { q: query });
  if (error) throw error;
  return data as SaleProduct[];
}

export async function listCategories() {
  if (isDemo) return demoCategories;
  const { data, error } = await supabase.from('categories').select('id,name').order('name');
  if (error) throw error;
  return data;
}

/** Saldo atual para avisos no carrinho. A validação definitiva é no servidor (finalize_sale). */
export async function getAvailableQty(productId: string): Promise<number | null> {
  if (isDemo) return demoProducts.find((p) => p.id === productId)?.stock_qty ?? null;
  const { data } = await supabase.from('products').select('stock_qty').eq('id', productId).single();
  return data?.stock_qty ?? null;
}

export type FinalizeResult =
  | { status: 'completed'; saleNumber: number; totalCents: number }
  | { status: 'queued'; clientId: string; totalCents: number } // sem internet → R4
  | { status: 'rejected'; message: string }; // ex.: estoque mudou em outro aparelho

/** Confirma a venda (SPEC §5.4). Online: RPC atômica que valida e baixa estoque. Offline: fila. */
export async function finalizeSale(cart: CartState, payment: PaymentMethod): Promise<FinalizeResult> {
  const s = summarize(cart);
  const clientId = randomUUID();
  const payload = {
    client_id: clientId,
    customer_id: cart.customerId,
    payment_method: payment,
    items: cart.items.map((i) => ({ product_id: i.product.id, qty: i.qty, discount_type: i.discount?.type ?? null, discount_value: i.discount?.value ?? null })),
  };
  if (isDemo) return { status: 'completed', saleNumber: 1048, totalCents: s.total };
  const net = await NetInfo.fetch();
  if (!net.isConnected || net.isInternetReachable === false) {
    await enqueue('sale', payload, clientId);
    return { status: 'queued', clientId, totalCents: s.total };
  }
  const { data, error } = await supabase.rpc('finalize_sale', { payload });
  if (error) {
    if (error.code === 'P0001') return { status: 'rejected', message: error.message };
    await enqueue('sale', payload, clientId); // falha de rede no meio → guarda e envia depois
    return { status: 'queued', clientId, totalCents: s.total };
  }
  const row = data as { number: number; total_cents: number };
  return { status: 'completed', saleNumber: row.number, totalCents: row.total_cents };
}
