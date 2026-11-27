/**
 * Acesso a dados. TODA tela usa estas funções — nunca chame supabase ou SQL direto de um componente.
 *  - Modo LOCAL (`isDemo`, sem .env): tudo no SQLite do aparelho via src/lib/local/engine.ts.
 *  - Modo REAL (com .env): Supabase (RPCs) + fila offline (outbox) + cache do catálogo.
 */
import NetInfo from '@react-native-community/netinfo';
import { randomUUID } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { isDemo } from '@/lib/env';
import { BusinessError, DuplicateCodeError, type Actor } from '@/lib/local/engine';
import { getEngine } from '@/lib/local/localDb';
import { readCachedProducts, searchCachedProducts, writeProductCache } from '@/lib/offline/catalog';
import { discardOutbox, enqueue, listOutbox, retryOutbox } from '@/lib/offline/outbox';
import { syncOutbox } from '@/lib/offline/sync';
import { supabase } from '@/lib/supabase';
import { searchTokens } from '@/lib/voice/parseQuery';
import { summarize, type CartState } from '@/features/cart/cart';
import type {
  CashClose, CashSessionRow, Customer, CustomerRow, DailyReport, OutboxItem, PaymentMethod, Product, ProductInput, SaleDetail, SaleProduct, SaleRow,
  SalesRange, StockEntryPayload, StockEntryResult, StockEntryRow, StockFilter, StockRow, StockSummary, SupplierRow, SyncStatus,
} from '@/types/domain';

export { BusinessError, DuplicateCodeError };

/* ------------------------------------------------------------------ usuário atual */
let actor: Actor | null = null;
/** Chamado pelo AuthProvider: quem está logado (vendedor das vendas, entradas e caixa). */
export function setRepoActor(u: Actor | null) { actor = u; }
const who = (): Actor => actor ?? { id: 'local', name: 'Vendedor' };

/** Erro de regra do servidor (P0001/23505) → BusinessError com a mensagem para o vendedor. */
function raise(error: { code?: string; message: string }): never {
  if (error.code === 'P0001') throw new BusinessError(error.message);
  throw new Error(error.message);
}
const isOffline = async () => { const n = await NetInfo.fetch(); return n.isConnected === false || n.isInternetReachable === false; };

/* ------------------------------------------------------------------ catálogo / venda */
const toSaleProduct = ({ id, code, name, photo_url, price_cents, category_id }: SaleProduct): SaleProduct => ({ id, code, name, photo_url, price_cents, category_id });

/** Lista para a grade da tela de vendas (sem custo, sem estoque — §2.2 do documento). */
export async function listSaleProducts(categoryId?: string | null): Promise<SaleProduct[]> {
  if (isDemo) return (await getEngine()).listSaleProducts(categoryId);
  try {
    if (await isOffline()) throw new Error('offline');
    let q = supabase.from('sale_products').select('*').order('name').limit(500);
    if (categoryId) q = q.eq('category_id', categoryId);
    const { data, error } = await q;
    if (error) throw error;
    const list = data as SaleProduct[];
    if (!categoryId) void writeProductCache(list).catch(() => {}); // catálogo completo vai para o cache (SPEC §8)
    return list;
  } catch {
    return readCachedProducts(categoryId); // sem internet: a grade continua funcionando
  }
}

/** Busca por nome/código conforme digita e pela voz. Todos os termos precisam aparecer (AND). */
export async function searchProducts(query: string): Promise<SaleProduct[]> {
  if (!searchTokens(query).length) return [];
  if (isDemo) return (await getEngine()).searchProducts(query);
  try {
    if (await isOffline()) throw new Error('offline');
    const { data, error } = await supabase.rpc('search_products', { q: query });
    if (error) throw error;
    return data as SaleProduct[];
  } catch {
    return searchCachedProducts(query);
  }
}

export async function listCategories(): Promise<{ id: string; name: string }[]> {
  if (isDemo) return (await getEngine()).listCategories();
  const { data, error } = await supabase.from('categories').select('id,name').order('name');
  if (error) return [];
  return data;
}

/** Saldo atual para avisos no carrinho. A validação definitiva é na venda (finalize_sale). */
export async function getAvailableQty(productId: string): Promise<number | null> {
  if (isDemo) return (await getEngine()).getAvailableQty(productId);
  const { data } = await supabase.from('products').select('stock_qty').eq('id', productId).single();
  return data?.stock_qty ?? null;
}

export type FinalizeResult =
  | { status: 'completed'; saleId: string; saleNumber: number; totalCents: number }
  | { status: 'queued'; clientId: string; totalCents: number } // sem internet → R4
  | { status: 'rejected'; message: string }; // ex.: estoque mudou em outro aparelho

/** Confirma a venda (SPEC §5.4). Atômica: valida e baixa estoque juntas. Sem rede (modo real): fila. */
export async function finalizeSale(cart: CartState, payment: PaymentMethod): Promise<FinalizeResult> {
  const s = summarize(cart);
  const clientId = randomUUID();
  const payload = {
    client_id: clientId,
    customer_id: cart.customerId,
    payment_method: payment,
    items: cart.items.map((i) => ({ product_id: i.product.id, qty: i.qty, discount_type: i.discount?.type ?? null, discount_value: i.discount?.value ?? null })),
  };
  if (isDemo) {
    try {
      const r = await (await getEngine()).finalizeSale(who(), payload);
      return { status: 'completed', saleId: r.id, saleNumber: r.number, totalCents: r.total_cents };
    } catch (e) {
      if (e instanceof BusinessError) return { status: 'rejected', message: e.message };
      throw e;
    }
  }
  if (await isOffline()) {
    await enqueue('sale', payload, clientId);
    return { status: 'queued', clientId, totalCents: s.total };
  }
  const { data, error } = await supabase.rpc('finalize_sale', { payload });
  if (error) {
    if (error.code === 'P0001') return { status: 'rejected', message: error.message };
    await enqueue('sale', payload, clientId); // falha de rede no meio → guarda e envia depois
    return { status: 'queued', clientId, totalCents: s.total };
  }
  const row = data as { id: string; number: number; total_cents: number };
  return { status: 'completed', saleId: row.id, saleNumber: row.number, totalCents: row.total_cents };
}

/* ------------------------------------------------------------------ clientes */
export async function searchCustomers(q = ''): Promise<CustomerRow[]> {
  if (isDemo) return (await getEngine()).listCustomers(q);
  const { data, error } = await supabase.from('customers').select('id,name,phone,created_at,sales(count)').order('name').limit(200);
  if (error) throw error;
  const needle = q.trim().toLowerCase(), digits = needle.replace(/\D/g, '');
  return (data as (Customer & { sales: { count: number }[] })[])
    .map((c) => ({ id: c.id, name: c.name, phone: c.phone, created_at: c.created_at, purchases: c.sales?.[0]?.count ?? 0 }))
    .filter((c) => !needle || c.name.toLowerCase().includes(needle) || (digits.length > 0 && c.phone.replace(/\D/g, '').includes(digits)));
}

export async function createCustomer(input: { name: string; phone: string }): Promise<Customer> {
  if (isDemo) return (await getEngine()).createCustomer(who(), input);
  if (await isOffline()) throw new BusinessError('Sem internet. Cadastre o cliente quando a conexão voltar.');
  const { data, error } = await supabase.from('customers').insert({ name: input.name.trim(), phone: input.phone.trim() }).select().single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

/* ------------------------------------------------------------------ produtos */
export async function listProducts(opts: { q?: string; filter?: string } = {}): Promise<Product[]> {
  if (isDemo) return (await getEngine()).listProducts(opts);
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw new Error(error.message);
  const toks = searchTokens(opts.q ?? '');
  return (data as Product[]).filter((p) => {
    if (opts.filter === 'inactive' ? p.active : opts.filter && opts.filter !== 'active' ? p.category_id !== opts.filter : !p.active) return false;
    const hay = searchTokens(`${p.name} ${p.code}`).join(' ');
    return toks.every((t) => hay.includes(t));
  });
}

export async function getProduct(id: string): Promise<Product | null> {
  if (isDemo) return (await getEngine()).getProduct(id);
  const { data } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  return (data as Product | null) ?? null;
}

/** Quem já usa este código (para avisar antes de salvar — tela R7). */
export async function findProductByCode(code: string, exceptId?: string): Promise<Product | null> {
  if (!code.trim()) return null;
  if (isDemo) return (await getEngine()).findProductByCode(code, exceptId);
  let q = supabase.from('products').select('*').ilike('code', code.trim());
  if (exceptId) q = q.neq('id', exceptId);
  const { data } = await q.limit(1);
  return ((data as Product[] | null)?.[0]) ?? null;
}

/** Cria/edita produto. O estoque NÃO muda aqui: só pela Entrada de mercadorias. */
export async function saveProduct(input: ProductInput, id?: string): Promise<Product> {
  if (isDemo) return (await getEngine()).saveProduct(input, id);
  if (await isOffline()) throw new BusinessError('Sem internet. Cadastro de produto exige conexão.');
  const row = { code: input.code.trim(), name: input.name.trim(), category_id: input.category_id, description: input.description, photo_url: input.photo_url,
    cost_cents: input.cost_cents, price_cents: input.price_cents, active: input.active };
  const res = id ? await supabase.from('products').update(row).eq('id', id).select().single() : await supabase.from('products').insert(row).select().single();
  if (res.error) {
    if (res.error.code === '23505') {
      const dup = await findProductByCode(row.code, id);
      throw new DuplicateCodeError(dup?.name ?? 'outro produto');
    }
    raise(res.error);
  }
  return res.data as Product;
}

/** Foto do produto: no modo local é copiada para a pasta do app; no real sobe para o Storage (`product-photos`). */
export async function uploadProductPhoto(uri: string): Promise<string> {
  const ext = (uri.split('.').pop() ?? 'jpg').split('?')[0]!.toLowerCase().slice(0, 4) || 'jpg';
  const name = `${randomUUID()}.${ext}`;
  if (isDemo) {
    const dest = new File(Paths.document, `foto-${name}`);
    dest.create({ overwrite: true });
    await new File(uri).copy(dest, { overwrite: true });
    return dest.uri;
  }
  const blob = await (await fetch(uri)).blob();
  const { error } = await supabase.storage.from('product-photos').upload(name, blob, { contentType: blob.type || 'image/jpeg' });
  if (error) throw new Error(error.message);
  return supabase.storage.from('product-photos').getPublicUrl(name).data.publicUrl;
}

/* ------------------------------------------------------------------ estoque e entrada */
export async function stockSummary(): Promise<StockSummary> {
  if (isDemo) return (await getEngine()).stockSummary();
  const { data, error } = await supabase.rpc('stock_summary');
  if (error) throw new Error(error.message);
  return data as StockSummary;
}

export async function listStock(opts: { q?: string; filter?: StockFilter } = {}): Promise<StockRow[]> {
  if (isDemo) return (await getEngine()).listStock(opts);
  const { data, error } = await supabase.from('products').select('id,code,name,stock_qty,min_stock,active,price_cents,cost_cents').eq('active', true).order('name');
  if (error) throw new Error(error.message);
  const toks = searchTokens(opts.q ?? '');
  return (data as StockRow[]).filter((r) => {
    const low = r.stock_qty > 0 && r.stock_qty <= (r.min_stock ?? 5);
    if (opts.filter === 'out' && r.stock_qty !== 0) return false;
    if (opts.filter === 'low' && !low) return false;
    const hay = searchTokens(`${r.name} ${r.code}`).join(' ');
    return toks.every((t) => hay.includes(t));
  });
}

export async function listSuppliers(): Promise<SupplierRow[]> {
  if (isDemo) return (await getEngine()).listSuppliers();
  const { data, error } = await supabase.from('suppliers').select('id,name,created_at').order('name');
  if (error) throw new Error(error.message);
  return data as SupplierRow[];
}

export async function listEntries(productId: string, limit = 3): Promise<StockEntryRow[]> {
  if (isDemo) return (await getEngine()).listEntries(productId, limit);
  const { data } = await supabase.from('stock_entries').select('id,qty,cost_cents,created_at,suppliers(name)').eq('product_id', productId).order('created_at', { ascending: false }).limit(limit);
  return ((data ?? []) as unknown as { id: string; qty: number; cost_cents: number | null; created_at: string; suppliers: { name: string } | null }[])
    .map((e) => ({ id: e.id, qty: e.qty, cost_cents: e.cost_cents, created_at: e.created_at, supplier_name: e.suppliers?.name ?? '' }));
}

/** Entrada de mercadorias: SOMA ao saldo (nunca substitui). Offline (modo real) vai para a fila. */
export async function registerStockEntry(p: StockEntryPayload): Promise<StockEntryResult> {
  if (isDemo) return (await getEngine()).registerStockEntry(who(), p);
  const payload = { ...p, client_id: p.client_id ?? randomUUID() };
  const queued = async (): Promise<StockEntryResult> => {
    await enqueue('stock_entry', payload, payload.client_id);
    return { id: payload.client_id, product_id: p.product_id ?? '', product_name: p.new_product?.name ?? '', product_code: p.new_product?.code ?? '', prev_qty: 0, new_qty: 0, qty: p.qty, supplier_name: p.supplier_name ?? '', cost_cents: p.cost_cents ?? null, queued: true };
  };
  if (await isOffline()) {
    if (!p.product_id) throw new BusinessError('Sem internet. Para cadastrar produto novo é preciso conexão.');
    return queued();
  }
  const { data, error } = await supabase.rpc('register_stock_entry', { payload });
  if (error) { if (error.code === 'P0001' || error.code === '23505') raise(error); return queued(); }
  const r = data as { id: string; product_id: string; new_qty: number };
  const prod = await getProduct(r.product_id);
  return { id: r.id, product_id: r.product_id, product_name: prod?.name ?? '', product_code: prod?.code ?? '', prev_qty: r.new_qty - p.qty, new_qty: r.new_qty, qty: p.qty, supplier_name: p.supplier_name ?? '', cost_cents: p.cost_cents ?? prod?.cost_cents ?? null };
}

/* ------------------------------------------------------------------ histórico e venda */
const dayStart = (offset: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d.toISOString(); };

export async function listSales(range: SalesRange): Promise<SaleRow[]> {
  if (isDemo) return (await getEngine()).listSales(range);
  let q = supabase.from('sales').select('id,number,status,payment_method,total_cents,discount_cents,created_at,seller:profiles!seller_id(name)').order('number', { ascending: false });
  if (range === 'cancelled') q = q.eq('status', 'cancelled');
  else if (range === 'today') q = q.gte('created_at', dayStart(0));
  else if (range === 'yesterday') q = q.gte('created_at', dayStart(-1)).lt('created_at', dayStart(0));
  else q = q.gte('created_at', dayStart(-6));
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data as unknown as (Omit<SaleRow, 'seller_name'> & { seller: { name: string } | null })[]).map((r) => ({ ...r, seller_name: r.seller?.name ?? '' }));
  // vendas feitas sem internet e ainda na fila aparecem como "Aguardando envio"
  const pending = (await listOutbox()).filter((o) => o.kind === 'sale' && o.status !== 'rejected');
  return [...pending.map((o) => ({ id: o.client_id, number: 0, status: 'completed' as const, payment_method: (JSON.parse(o.payload).payment_method ?? 'pix') as PaymentMethod,
    total_cents: 0, discount_cents: 0, seller_name: who().name, created_at: o.created_at, pending: true })), ...rows];
}

export async function getSale(id: string): Promise<SaleDetail | null> {
  if (isDemo) return (await getEngine()).getSale(id);
  const { data } = await supabase.from('sales').select('*, seller:profiles!seller_id(name), customer:customers(name), canceller:profiles!cancelled_by(name), items:sale_items(*)').eq('id', id).maybeSingle();
  if (!data) return null;
  const d = data as unknown as SaleDetail & { seller: { name: string } | null; customer: { name: string } | null; canceller: { name: string } | null };
  return { ...d, seller_name: d.seller?.name ?? '', customer_name: d.customer?.name ?? null, cancelled_by_name: d.canceller?.name ?? null };
}

/** Cancela a venda (motivo obrigatório) e devolve os itens ao estoque. Venda ainda na fila não pode ser cancelada. */
export async function cancelSale(saleId: string, reason: string): Promise<void> {
  if (isDemo) { await (await getEngine()).cancelSale(who(), { sale_id: saleId, reason }); return; }
  if (!reason.trim()) throw new BusinessError('Informe o motivo para continuar.');
  const payload = { sale_id: saleId, reason: reason.trim() };
  if (await isOffline()) { await enqueue('cancel_sale', payload); return; }
  const { error } = await supabase.rpc('cancel_sale', { payload });
  if (error) { if (error.code === 'P0001') raise(error); await enqueue('cancel_sale', payload); }
}

/* ------------------------------------------------------------------ caixa e relatório */
export async function getOpenCashSession(): Promise<CashSessionRow | null> {
  if (isDemo) return (await getEngine()).getOpenSession();
  const { data } = await supabase.from('cash_sessions').select('*, opener:profiles!opened_by(name)').is('closed_at', null).maybeSingle();
  if (!data) return null;
  const d = data as unknown as CashSessionRow & { opener: { name: string } | null };
  return { ...d, opened_by_name: d.opener?.name ?? '', closed_by_name: null };
}

export async function getLastClosedSession(): Promise<CashSessionRow | null> {
  if (isDemo) return (await getEngine()).lastClosedSession();
  const { data } = await supabase.from('cash_sessions').select('*, closer:profiles!closed_by(name)').not('closed_at', 'is', null).order('closed_at', { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  const d = data as unknown as CashSessionRow & { closer: { name: string } | null };
  return { ...d, opened_by_name: '', closed_by_name: d.closer?.name ?? null };
}

export async function openCashSession(openingCents: number): Promise<void> {
  if (isDemo) { await (await getEngine()).openCash(who(), openingCents); return; }
  const { error } = await supabase.rpc('open_cash_session', { opening_cents: openingCents });
  if (error) raise(error);
}

/** Esperado na gaveta: troco + vendas em dinheiro não canceladas da sessão. */
export async function getCashExpected(): Promise<{ session: CashSessionRow; opening_cents: number; cash_sales_cents: number; expected_cents: number } | null> {
  if (isDemo) return (await getEngine()).cashExpected();
  const session = await getOpenCashSession();
  if (!session) return null;
  const { data } = await supabase.from('sales').select('total_cents').eq('cash_session_id', session.id).eq('payment_method', 'dinheiro').eq('status', 'completed');
  const cash = (data as { total_cents: number }[] | null)?.reduce((a, s) => a + s.total_cents, 0) ?? 0;
  return { session, opening_cents: session.opening_cents, cash_sales_cents: cash, expected_cents: session.opening_cents + cash };
}

export async function closeCashSession(countedCents: number, note?: string | null): Promise<CashClose> {
  if (isDemo) return (await getEngine()).closeCash(who(), countedCents, note);
  const before = await getCashExpected();
  const { data, error } = await supabase.rpc('close_cash_session', { counted_cents: countedCents, note: note ?? null });
  if (error) raise(error);
  const r = data as { expected_cents: number; counted_cents: number; difference_cents: number };
  return { ...r, closed_at: new Date().toISOString(), closed_by_name: who().name, opening_cents: before?.opening_cents ?? 0, cash_sales_cents: before?.cash_sales_cents ?? 0 };
}

export async function getDailyReport(day?: string): Promise<DailyReport> {
  if (isDemo) return (await getEngine()).dailyReport(day);
  const { data, error } = await supabase.rpc('daily_report', day ? { day } : {});
  if (error) throw new Error(error.message);
  const r = data as Omit<DailyReport, 'cancelled_count' | 'sellers_count' | 'cancelled_cents' | 'by_payment'> & { by_payment: Record<string, number> };
  return { ...r, by_payment: r.by_payment as DailyReport['by_payment'], cancelled_count: r.cancelled.length, sellers_count: r.by_seller.length, cancelled_cents: r.cancelled.reduce((a, c) => a + c.total_cents, 0) };
}

/* ------------------------------------------------------------------ sincronização */
const summarizeOutbox = (kind: OutboxItem['kind'], payload: string): string => {
  const p = JSON.parse(payload) as { items?: { qty: number }[]; qty?: number; reason?: string };
  if (kind === 'sale') return `Venda · ${p.items?.reduce((a, i) => a + i.qty, 0) ?? 0} un`;
  if (kind === 'stock_entry') return `Entrada de mercadorias · +${p.qty ?? 0} un`;
  return `Cancelamento · ${p.reason ?? ''}`;
};

export async function getSyncStatus(): Promise<SyncStatus> {
  if (isDemo) {
    const t = await (await getEngine()).todayCounts();
    return { pending: [], attention: [], sentToday: { sales: t.sales, entries: t.entries, lastAt: t.lastAt }, localMode: true };
  }
  const rows = await listOutbox();
  const items: OutboxItem[] = rows.map((r) => ({ client_id: r.client_id, kind: r.kind, status: r.status, last_error: r.last_error, created_at: r.created_at, summary: summarizeOutbox(r.kind, r.payload) }));
  const { count } = await supabase.from('sales').select('id', { count: 'exact', head: true }).gte('created_at', dayStart(0));
  return { pending: items.filter((i) => i.status !== 'rejected'), attention: items.filter((i) => i.status === 'rejected'), sentToday: { sales: count ?? 0, entries: 0, lastAt: null }, localMode: false };
}

export async function pendingCount(): Promise<number> {
  if (isDemo) return 0;
  return (await listOutbox()).length;
}

/** "Tentar enviar agora" / "Tentar de novo". */
export async function syncNow(clientId?: string): Promise<{ sent: number; failed: number; rejected: number }> {
  if (isDemo) return { sent: 0, failed: 0, rejected: 0 };
  if (clientId) await retryOutbox(clientId);
  return syncOutbox();
}
export async function discardPending(clientId: string): Promise<void> { if (!isDemo) await discardOutbox(clientId); }
