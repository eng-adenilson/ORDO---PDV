/**
 * Motor local do ORDO: faz no SQLite do aparelho o mesmo que as RPCs do Supabase
 * (supabase/migrations/0002_rpc.sql). Estoque, vendas, cancelamentos, entradas e caixa
 * só mudam por aqui, dentro de transação (SPEC §9). Nenhuma tela escreve SQL.
 */
import { unitPriceAfterDiscount } from '../../features/cart/pricing.ts';
import { searchTokens } from '../voice/parseQuery.ts';
import type {
  CashClose, CashSessionRow, Cents, Customer, CustomerRow, DailyReport, PaymentMethod, Product, ProductInput, SaleDetail,
  SaleProduct, SaleRow, SalesRange, StockEntryPayload, StockEntryResult, StockEntryRow, StockFilter, StockRow, StockSummary, SupplierRow,
} from '../../types/domain.ts';
import { SCHEMA_SQL, SCHEMA_VERSION, type Db } from './schema.ts';
import { seedStatements } from './seed.ts';

/** Erro de regra de negócio (equivale ao ERRCODE P0001 das RPCs). A mensagem já é para o vendedor ler. */
export class BusinessError extends Error {
  code: string;
  constructor(message: string, code = 'P0001') { super(message); this.name = 'BusinessError'; this.code = code; }
}
export class DuplicateCodeError extends BusinessError {
  existingName: string;
  constructor(existingName: string) { super(`Código já usado por ${existingName}.`, '23505'); this.name = 'DuplicateCodeError'; this.existingName = existingName; }
}

export interface Actor { id: string; name: string }
export interface EngineDeps { db: Db; uuid: () => string; now?: () => Date }

export interface SalePayload {
  client_id: string; customer_id?: string | null; payment_method: PaymentMethod;
  items: { product_id: string; qty: number; discount_type?: 'amount' | 'percent' | null; discount_value?: number | null }[];
}

const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const LOW_DEFAULT = 5;

type ProductRow = Omit<Product, 'active'> & { active: number };
const toProduct = (r: ProductRow): Product => ({ ...r, active: !!r.active });
const toSaleProduct = (p: Pick<Product, 'id' | 'code' | 'name' | 'photo_url' | 'price_cents' | 'category_id'>): SaleProduct =>
  ({ id: p.id, code: p.code, name: p.name, photo_url: p.photo_url, price_cents: p.price_cents, category_id: p.category_id });

export function createEngine({ db, uuid, now = () => new Date() }: EngineDeps) {
  const iso = () => now().toISOString();

  /** Cria as tabelas e o catálogo inicial (uma vez). */
  async function init() {
    await db.execAsync(SCHEMA_SQL);
    const v = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = 'seeded'");
    if (v) return;
    await db.withTransactionAsync(async () => {
      for (const s of seedStatements(iso())) await db.runAsync(s.sql, s.params);
      await db.runAsync("INSERT INTO meta (key, value) VALUES ('seeded', ?)", [String(SCHEMA_VERSION)]);
    });
  }

  /* ------------------------------------------------------------ catálogo (tela de vendas) */
  async function listSaleProducts(categoryId?: string | null): Promise<SaleProduct[]> {
    const rows = await db.getAllAsync<ProductRow>(
      `SELECT * FROM products WHERE active = 1 ${categoryId ? 'AND category_id = ?' : ''} ORDER BY name`, categoryId ? [categoryId] : []);
    return rows.map(toSaleProduct);
  }

  async function searchProducts(query: string): Promise<SaleProduct[]> {
    const toks = searchTokens(query);
    if (!toks.length) return [];
    const rows = await db.getAllAsync<ProductRow>('SELECT * FROM products WHERE active = 1 ORDER BY name');
    return rows.filter((p) => {
      const hay = searchTokens(`${p.name} ${p.code}`).join(' ');
      return toks.every((t) => hay.includes(t));
    }).slice(0, 30).map(toSaleProduct);
  }

  const listCategories = () => db.getAllAsync<{ id: string; name: string }>('SELECT id, name FROM categories ORDER BY name');

  async function getAvailableQty(productId: string): Promise<number | null> {
    const r = await db.getFirstAsync<{ stock_qty: number }>('SELECT stock_qty FROM products WHERE id = ?', [productId]);
    return r ? r.stock_qty : null;
  }

  /* ------------------------------------------------------------ vendas */
  async function finalizeSale(actor: Actor, payload: SalePayload) {
    const existing = await db.getFirstAsync<{ id: string; number: number; total_cents: number }>('SELECT id, number, total_cents FROM sales WHERE client_id = ?', [payload.client_id]);
    if (existing) return existing; // reenvio: devolve o que já foi gravado
    if (!payload.items?.length) throw new BusinessError('Carrinho vazio.');

    let result = { id: '', number: 0, total_cents: 0 };
    await db.withTransactionAsync(async () => {
      const session = await db.getFirstAsync<{ id: string }>('SELECT id FROM cash_sessions WHERE closed_at IS NULL LIMIT 1');
      const maxN = await db.getFirstAsync<{ n: number | null }>('SELECT MAX(number) AS n FROM sales');
      const number = (maxN?.n ?? 0) + 1;
      const saleId = uuid();
      const customer = payload.customer_id ? await db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?', [payload.customer_id]) : null;
      let gross = 0, disc = 0;
      const lines: unknown[][] = [];
      const items = [...payload.items].sort((a, b) => a.product_id.localeCompare(b.product_id));
      for (const it of items) {
        const qty = Math.trunc(Number(it.qty));
        if (!qty || qty <= 0) throw new BusinessError('Quantidade inválida.');
        const p = await db.getFirstAsync<ProductRow>('SELECT * FROM products WHERE id = ?', [it.product_id]);
        if (!p || !p.active) throw new BusinessError('Produto indisponível.');
        if (p.stock_qty < qty) throw new BusinessError(`${p.name}: só ${p.stock_qty} em estoque.`);
        const unit = p.price_cents ?? 0; // preço do banco; a tela não define preço
        const d = it.discount_type && it.discount_value ? { type: it.discount_type, value: Number(it.discount_value) } : null;
        const final = unitPriceAfterDiscount(unit, d);
        lines.push([uuid(), saleId, p.id, p.name, qty, unit, d?.type ?? null, d?.value ?? null, final * qty]);
        await db.runAsync('UPDATE products SET stock_qty = stock_qty - ?, updated_at = ? WHERE id = ?', [qty, iso(), p.id]);
        await db.runAsync('INSERT INTO stock_movements (id, product_id, delta, reason, ref_id, user_id, created_at) VALUES (?,?,?,?,?,?,?)',
          [uuid(), p.id, -qty, 'sale', saleId, actor.id, iso()]);
        gross += unit * qty; disc += (unit - final) * qty;
      }
      const t = now();
      await db.runAsync(
        `INSERT INTO sales (id, number, client_id, seller_id, seller_name, customer_id, customer_name, cash_session_id, payment_method,
           gross_cents, discount_cents, total_cents, status, day, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'completed', ?, ?)`,
        [saleId, number, payload.client_id, actor.id, actor.name, customer?.id ?? null, customer?.name ?? null, session?.id ?? null,
          payload.payment_method, gross, disc, gross - disc, ymd(t), t.toISOString()]);
      for (const l of lines) {
        await db.runAsync('INSERT INTO sale_items (id, sale_id, product_id, product_name, qty, unit_price_cents, discount_type, discount_value, line_total_cents) VALUES (?,?,?,?,?,?,?,?,?)', l);
      }
      result = { id: saleId, number, total_cents: gross - disc };
    });
    return result;
  }

  async function cancelSale(actor: Actor, payload: { sale_id: string; reason: string }) {
    const reason = (payload.reason ?? '').trim();
    if (!reason) throw new BusinessError('Informe o motivo para continuar.');
    const sale = await db.getFirstAsync<{ id: string; status: string }>('SELECT id, status FROM sales WHERE id = ?', [payload.sale_id]);
    if (!sale) throw new BusinessError('Venda não encontrada.');
    if (sale.status === 'cancelled') return { id: sale.id, status: 'cancelled' as const };
    await db.withTransactionAsync(async () => {
      const items = await db.getAllAsync<{ product_id: string; qty: number }>('SELECT product_id, qty FROM sale_items WHERE sale_id = ?', [sale.id]);
      for (const it of items) {
        await db.runAsync('UPDATE products SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?', [it.qty, iso(), it.product_id]);
        await db.runAsync('INSERT INTO stock_movements (id, product_id, delta, reason, ref_id, user_id, created_at) VALUES (?,?,?,?,?,?,?)',
          [uuid(), it.product_id, it.qty, 'sale_cancel', sale.id, actor.id, iso()]);
      }
      await db.runAsync("UPDATE sales SET status = 'cancelled', cancel_reason = ?, cancelled_at = ?, cancelled_by_name = ? WHERE id = ?", [reason, iso(), actor.name, sale.id]);
    });
    return { id: sale.id, status: 'cancelled' as const };
  }

  const saleCols = 'id, number, status, payment_method, total_cents, discount_cents, seller_name, created_at';
  async function listSales(range: SalesRange): Promise<SaleRow[]> {
    const today = now();
    if (range === 'cancelled') return db.getAllAsync<SaleRow>(`SELECT ${saleCols} FROM sales WHERE status = 'cancelled' ORDER BY number DESC`);
    if (range === '7d') return db.getAllAsync<SaleRow>(`SELECT ${saleCols} FROM sales WHERE day >= ? ORDER BY number DESC`, [ymd(addDays(today, -6))]);
    const day = ymd(range === 'today' ? today : addDays(today, -1));
    return db.getAllAsync<SaleRow>(`SELECT ${saleCols} FROM sales WHERE day = ? ORDER BY number DESC`, [day]);
  }

  async function getSale(id: string): Promise<SaleDetail | null> {
    const s = await db.getFirstAsync<Omit<SaleDetail, 'items'>>('SELECT * FROM sales WHERE id = ?', [id]);
    if (!s) return null;
    const items = await db.getAllAsync<SaleDetail['items'][number]>(
      `SELECT i.*, p.photo_url AS photo_url FROM sale_items i LEFT JOIN products p ON p.id = i.product_id WHERE i.sale_id = ? ORDER BY i.product_name`, [id]);
    return { ...s, items };
  }

  /* ------------------------------------------------------------ produtos */
  async function listProducts(opts: { q?: string; filter?: 'active' | 'inactive' | string } = {}): Promise<Product[]> {
    const rows = await db.getAllAsync<ProductRow>('SELECT * FROM products ORDER BY name');
    const toks = searchTokens(opts.q ?? '');
    return rows.map(toProduct).filter((p) => {
      if (opts.filter === 'inactive' ? p.active : opts.filter && opts.filter !== 'active' ? p.category_id !== opts.filter : !p.active) return false;
      if (!toks.length) return true;
      const hay = searchTokens(`${p.name} ${p.code}`).join(' ');
      return toks.every((t) => hay.includes(t));
    });
  }
  async function getProduct(id: string): Promise<Product | null> {
    const r = await db.getFirstAsync<ProductRow>('SELECT * FROM products WHERE id = ?', [id]);
    return r ? toProduct(r) : null;
  }
  async function findProductByCode(code: string, exceptId?: string): Promise<Product | null> {
    const r = await db.getFirstAsync<ProductRow>('SELECT * FROM products WHERE lower(code) = lower(?) AND id <> ?', [code.trim(), exceptId ?? '']);
    return r ? toProduct(r) : null;
  }
  /** Cadastro/edição. O estoque NÃO é editável aqui: entra só pela Entrada de mercadorias (SPEC §5.2). */
  async function saveProduct(input: ProductInput, id?: string): Promise<Product> {
    const code = input.code.trim(), name = input.name.trim();
    if (!name) throw new BusinessError('Informe o nome do produto.');
    if (!code) throw new BusinessError('Informe o código do produto.');
    const dup = await findProductByCode(code, id);
    if (dup) throw new DuplicateCodeError(dup.name);
    const t = iso();
    const pid = id ?? uuid();
    if (id) {
      await db.runAsync(
        `UPDATE products SET code=?, name=?, category_id=?, description=?, photo_url=?, cost_cents=?, price_cents=?, active=?, min_stock=COALESCE(?, min_stock), updated_at=? WHERE id=?`,
        [code, name, input.category_id, input.description, input.photo_url, input.cost_cents, input.price_cents, input.active ? 1 : 0, input.min_stock ?? null, t, id]);
    } else {
      await db.runAsync(
        `INSERT INTO products (id, code, name, category_id, description, photo_url, cost_cents, price_cents, stock_qty, min_stock, active, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,0,?,?,?,?)`,
        [pid, code, name, input.category_id, input.description, input.photo_url, input.cost_cents, input.price_cents, input.min_stock ?? null, input.active ? 1 : 0, t, t]);
    }
    return (await getProduct(pid))!;
  }

  /* ------------------------------------------------------------ estoque */
  const isLow = (r: { stock_qty: number; min_stock: number | null }) => r.stock_qty > 0 && r.stock_qty <= (r.min_stock ?? LOW_DEFAULT);

  async function stockSummary(): Promise<StockSummary> {
    const rows = await db.getAllAsync<ProductRow>('SELECT * FROM products WHERE active = 1');
    return {
      products: rows.length,
      units: rows.reduce((a, r) => a + r.stock_qty, 0),
      cost_value_cents: rows.reduce((a, r) => a + r.stock_qty * (r.cost_cents ?? 0), 0),
      sale_value_cents: rows.reduce((a, r) => a + r.stock_qty * (r.price_cents ?? 0), 0),
      out_of_stock: rows.filter((r) => r.stock_qty === 0).length,
      low_stock: rows.filter(isLow).length,
    };
  }

  async function listStock(opts: { q?: string; filter?: StockFilter } = {}): Promise<StockRow[]> {
    const toks = searchTokens(opts.q ?? '');
    const rows = await db.getAllAsync<ProductRow>('SELECT * FROM products WHERE active = 1 ORDER BY name');
    return rows.filter((r) => {
      if (opts.filter === 'out' && r.stock_qty !== 0) return false;
      if (opts.filter === 'low' && !isLow(r)) return false;
      if (!toks.length) return true;
      const hay = searchTokens(`${r.name} ${r.code}`).join(' ');
      return toks.every((t) => hay.includes(t));
    }).map((r) => ({ id: r.id, code: r.code, name: r.name, stock_qty: r.stock_qty, min_stock: r.min_stock, active: !!r.active, price_cents: r.price_cents, cost_cents: r.cost_cents }));
  }

  async function listSuppliers(): Promise<SupplierRow[]> { return db.getAllAsync<SupplierRow>('SELECT * FROM suppliers ORDER BY name'); }

  async function listEntries(productId: string, limit = 3): Promise<StockEntryRow[]> {
    return db.getAllAsync<StockEntryRow>('SELECT id, qty, cost_cents, supplier_name, created_at FROM stock_entries WHERE product_id = ? ORDER BY created_at DESC LIMIT ?', [productId, limit]);
  }

  async function registerStockEntry(actor: Actor, p: StockEntryPayload): Promise<StockEntryResult> {
    const qty = Math.trunc(Number(p.qty));
    if (!qty || qty <= 0) throw new BusinessError('Informe a quantidade recebida.');
    if (p.client_id) {
      const e = await db.getFirstAsync<{ id: string; product_id: string; qty: number; prev_qty: number; supplier_name: string; cost_cents: number | null }>('SELECT * FROM stock_entries WHERE client_id = ?', [p.client_id]);
      if (e) {
        const prod = (await getProduct(e.product_id))!;
        return { id: e.id, product_id: e.product_id, product_name: prod.name, product_code: prod.code, prev_qty: e.prev_qty, new_qty: e.prev_qty + e.qty, qty: e.qty, supplier_name: e.supplier_name, cost_cents: e.cost_cents };
      }
    }
    const supplierName = (p.supplier_name ?? '').trim();
    if (!p.supplier_id && !supplierName) throw new BusinessError('Informe o fornecedor.');
    let result!: StockEntryResult;
    await db.withTransactionAsync(async () => {
      let supplierId = p.supplier_id ?? null, sName = supplierName;
      if (supplierId) {
        const s = await db.getFirstAsync<{ name: string }>('SELECT name FROM suppliers WHERE id = ?', [supplierId]);
        if (!s) throw new BusinessError('Fornecedor não encontrado.');
        sName = s.name;
      } else {
        const s = await db.getFirstAsync<{ id: string }>('SELECT id FROM suppliers WHERE lower(name) = lower(?)', [sName]);
        supplierId = s?.id ?? uuid();
        if (!s) await db.runAsync('INSERT INTO suppliers (id, name, created_at) VALUES (?,?,?)', [supplierId, sName, iso()]);
      }
      let productId = p.product_id ?? null;
      if (!productId) {
        if (!p.new_product) throw new BusinessError('Produto não encontrado.');
        const np = await saveProduct({
          code: p.new_product.code, name: p.new_product.name, category_id: p.new_product.category_id ?? null, description: p.new_product.description ?? null,
          photo_url: p.new_product.photo_url ?? null, cost_cents: p.cost_cents ?? null, price_cents: p.price_cents ?? null, active: true,
        });
        productId = np.id;
      }
      const prod = await getProduct(productId);
      if (!prod) throw new BusinessError('Produto não encontrado.');
      const entryId = uuid();
      await db.runAsync(
        `UPDATE products SET stock_qty = stock_qty + ?, cost_cents = COALESCE(?, cost_cents), price_cents = COALESCE(?, price_cents), updated_at = ? WHERE id = ?`,
        [qty, p.cost_cents ?? null, p.price_cents ?? null, iso(), productId]); // soma, nunca substitui (§8.1)
      await db.runAsync(
        `INSERT INTO stock_entries (id, client_id, product_id, qty, prev_qty, cost_cents, price_cents, supplier_id, supplier_name, user_id, user_name, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [entryId, p.client_id ?? null, productId, qty, prod.stock_qty, p.cost_cents ?? null, p.price_cents ?? null, supplierId, sName, actor.id, actor.name, iso()]);
      await db.runAsync('INSERT INTO stock_movements (id, product_id, delta, reason, ref_id, user_id, created_at) VALUES (?,?,?,?,?,?,?)', [uuid(), productId, qty, 'entry', entryId, actor.id, iso()]);
      result = { id: entryId, product_id: productId, product_name: prod.name, product_code: prod.code, prev_qty: prod.stock_qty, new_qty: prod.stock_qty + qty, qty, supplier_name: sName, cost_cents: p.cost_cents ?? prod.cost_cents };
    });
    return result;
  }

  /* ------------------------------------------------------------ clientes */
  async function listCustomers(q = ''): Promise<CustomerRow[]> {
    const rows = await db.getAllAsync<CustomerRow>(
      `SELECT c.*, (SELECT COUNT(*) FROM sales s WHERE s.customer_id = c.id AND s.status = 'completed') AS purchases FROM customers c ORDER BY c.name`);
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/\D/g, '');
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return rows.filter((c) => !needle || norm(c.name).includes(norm(needle)) || (digits.length > 0 && c.phone.replace(/\D/g, '').includes(digits)));
  }
  async function createCustomer(actor: Actor, input: { name: string; phone: string }): Promise<Customer> {
    const name = input.name.trim(), phone = input.phone.trim();
    if (!name) throw new BusinessError('Informe o nome do cliente.');
    if (phone.replace(/\D/g, '').length < 10) throw new BusinessError('Informe o telefone com DDD.');
    const id = uuid(), t = iso();
    await db.runAsync('INSERT INTO customers (id, name, phone, created_at) VALUES (?,?,?,?)', [id, name, phone, t]);
    void actor;
    return { id, name, phone, created_at: t };
  }

  /* ------------------------------------------------------------ caixa e relatório */
  async function getOpenSession(): Promise<CashSessionRow | null> {
    return db.getFirstAsync<CashSessionRow>('SELECT * FROM cash_sessions WHERE closed_at IS NULL LIMIT 1');
  }
  async function lastClosedSession(): Promise<CashSessionRow | null> {
    return db.getFirstAsync<CashSessionRow>('SELECT * FROM cash_sessions WHERE closed_at IS NOT NULL ORDER BY closed_at DESC LIMIT 1');
  }
  async function openCash(actor: Actor, openingCents: Cents): Promise<CashSessionRow> {
    if (!Number.isFinite(openingCents) || openingCents < 0) throw new BusinessError('Informe o valor inicial para troco.');
    if (await getOpenSession()) throw new BusinessError('Já existe um caixa aberto.');
    const id = uuid();
    await db.runAsync('INSERT INTO cash_sessions (id, opened_by, opened_by_name, opened_at, opening_cents) VALUES (?,?,?,?,?)', [id, actor.id, actor.name, iso(), openingCents]);
    return (await getOpenSession())!;
  }
  /** Esperado = troco inicial + vendas em DINHEIRO não canceladas da sessão (requisitos §10.3). */
  async function expectedInDrawer(s: { id: string; opening_cents: number }) {
    const r = await db.getFirstAsync<{ t: number | null }>("SELECT SUM(total_cents) AS t FROM sales WHERE cash_session_id = ? AND payment_method = 'dinheiro' AND status = 'completed'", [s.id]);
    const cash = r?.t ?? 0;
    return { cash, expected: s.opening_cents + cash };
  }
  async function cashExpected() {
    const s = await getOpenSession();
    if (!s) return null;
    const e = await expectedInDrawer(s);
    return { session: s, opening_cents: s.opening_cents, cash_sales_cents: e.cash, expected_cents: e.expected };
  }
  async function closeCash(actor: Actor, countedCents: Cents, note?: string | null): Promise<CashClose> {
    const s = await getOpenSession();
    if (!s) throw new BusinessError('Nenhum caixa aberto.');
    if (!Number.isFinite(countedCents) || countedCents < 0) throw new BusinessError('Informe quanto você contou na gaveta.');
    const e = await expectedInDrawer(s);
    const t = iso();
    await db.runAsync('UPDATE cash_sessions SET closed_at=?, closed_by=?, closed_by_name=?, expected_cents=?, counted_cents=?, note=? WHERE id=?',
      [t, actor.id, actor.name, e.expected, countedCents, note?.trim() || null, s.id]);
    return { expected_cents: e.expected, counted_cents: countedCents, difference_cents: countedCents - e.expected, closed_at: t, closed_by_name: actor.name, opening_cents: s.opening_cents, cash_sales_cents: e.cash };
  }

  async function dailyReport(day: string = ymd(now())): Promise<DailyReport> {
    const all = await db.getAllAsync<{ id: string; number: number; status: string; payment_method: PaymentMethod; gross_cents: number; discount_cents: number; total_cents: number; seller_name: string; cancel_reason: string | null }>(
      'SELECT id, number, status, payment_method, gross_cents, discount_cents, total_cents, seller_name, cancel_reason FROM sales WHERE day = ? ORDER BY number', [day]);
    const ok = all.filter((s) => s.status === 'completed'), canc = all.filter((s) => s.status === 'cancelled');
    const sum = (a: { total_cents: number }[]) => a.reduce((x, s) => x + s.total_cents, 0);
    const by_payment: DailyReport['by_payment'] = {};
    for (const s of ok) by_payment[s.payment_method] = (by_payment[s.payment_method] ?? 0) + s.total_cents;
    const sellers = new Map<string, { name: string; count: number; total_cents: number }>();
    for (const s of ok) { const x = sellers.get(s.seller_name) ?? { name: s.seller_name, count: 0, total_cents: 0 }; x.count++; x.total_cents += s.total_cents; sellers.set(s.seller_name, x); }
    const items = ok.length
      ? await db.getAllAsync<{ product_name: string; q: number }>(
        `SELECT product_name, SUM(qty) AS q FROM sale_items WHERE sale_id IN (${ok.map(() => '?').join(',')}) GROUP BY product_name ORDER BY q DESC, product_name`, ok.map((s) => s.id))
      : [];
    return {
      date: day, sales_count: ok.length, cancelled_count: canc.length, sellers_count: sellers.size,
      gross_cents: ok.reduce((x, s) => x + s.gross_cents, 0), discount_cents: ok.reduce((x, s) => x + s.discount_cents, 0), net_cents: sum(ok), cancelled_cents: sum(canc),
      cancelled: canc.map((s) => ({ number: s.number, reason: s.cancel_reason, total_cents: s.total_cents })),
      by_payment, by_seller: [...sellers.values()].sort((a, b) => b.total_cents - a.total_cents),
      products: items.map((i) => ({ name: i.product_name, qty: i.q })),
    };
  }

  /** Quantas vendas / entradas foram gravadas hoje (tela Sincronização). */
  async function todayCounts() {
    const day = ymd(now());
    const s = await db.getFirstAsync<{ n: number; last: string | null }>('SELECT COUNT(*) AS n, MAX(created_at) AS last FROM sales WHERE day = ?', [day]);
    const e = await db.getFirstAsync<{ n: number; last: string | null }>('SELECT COUNT(*) AS n, MAX(created_at) AS last FROM stock_entries WHERE substr(created_at, 1, 10) = ?', [now().toISOString().slice(0, 10)]);
    const last = [s?.last, e?.last].filter(Boolean).sort().pop() ?? null;
    return { sales: s?.n ?? 0, entries: e?.n ?? 0, lastAt: last };
  }

  return {
    init, listSaleProducts, searchProducts, listCategories, getAvailableQty,
    finalizeSale, cancelSale, listSales, getSale,
    listProducts, getProduct, findProductByCode, saveProduct,
    stockSummary, listStock, listSuppliers, listEntries, registerStockEntry,
    listCustomers, createCustomer,
    getOpenSession, lastClosedSession, openCash, cashExpected, closeCash, dailyReport, todayCounts,
  };
}
export type Engine = ReturnType<typeof createEngine>;
