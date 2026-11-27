/** Tipos de domínio — espelham supabase/migrations/0001_schema.sql. Valores monetários em CENTAVOS (inteiro). */
export type UUID = string;
export type Cents = number;

export type PaymentMethod = 'pix' | 'dinheiro' | 'credito' | 'debito';
export const PAYMENT_LABEL: Record<PaymentMethod, string> = { pix: 'Pix', dinheiro: 'Dinheiro', credito: 'Crédito', debito: 'Débito' };

export interface Profile { id: UUID; name: string; email: string }
export interface Category { id: UUID; name: string }
export interface Supplier { id: UUID; name: string }
export interface Customer { id: UUID; name: string; phone: string; created_at: string }

export interface Product {
  id: UUID;
  code: string; // único
  name: string;
  category_id: UUID | null;
  description: string | null;
  photo_url: string | null;
  cost_cents: Cents | null; // NUNCA exibir na tela de vendas
  price_cents: Cents | null;
  stock_qty: number; // inteiro
  min_stock: number | null; // critério de estoque baixo (pendente §13.3) — null = usa padrão do app
  active: boolean;
}

/** Produto como a tela de vendas pode vê-lo (sem custo). */
export type SaleProduct = Pick<Product, 'id' | 'code' | 'name' | 'photo_url' | 'price_cents' | 'category_id'>;

export type DiscountType = 'amount' | 'percent';
export interface Discount { type: DiscountType; value: number } // amount em centavos; percent 0–100

export type SaleStatus = 'completed' | 'cancelled';
export interface Sale {
  id: UUID;
  number: number; // #1048
  seller_id: UUID;
  customer_id: UUID | null;
  payment_method: PaymentMethod;
  gross_cents: Cents;
  discount_cents: Cents;
  total_cents: Cents;
  status: SaleStatus;
  cancel_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: UUID | null;
  cash_session_id: UUID | null;
  client_id: string; // id gerado no aparelho (idempotência da sincronização)
  created_at: string;
}
export interface SaleItem {
  id: UUID; sale_id: UUID; product_id: UUID; product_name: string; qty: number;
  unit_price_cents: Cents; discount_type: DiscountType | null; discount_value: number | null; line_total_cents: Cents;
}

export interface StockEntry {
  id: UUID; product_id: UUID; qty: number; cost_cents: Cents | null; price_cents: Cents | null;
  supplier_id: UUID; user_id: UUID; created_at: string;
}

export interface CashSession {
  id: UUID; opened_by: UUID; opened_at: string; opening_cents: Cents;
  closed_by: UUID | null; closed_at: string | null; counted_cents: Cents | null; expected_cents: Cents | null; note: string | null;
}

/* ---------- Tipos de leitura usados pelas telas (resultado do repo) ---------- */
export interface CustomerRow extends Customer { purchases: number }
export type StockFilter = 'all' | 'low' | 'out';
export interface StockRow { id: UUID; code: string; name: string; stock_qty: number; min_stock: number | null; active: boolean; price_cents: Cents | null; cost_cents: Cents | null }
export interface StockSummary { products: number; units: number; cost_value_cents: Cents; sale_value_cents: Cents; out_of_stock: number; low_stock: number }
export interface ProductInput {
  code: string; name: string; category_id: UUID | null; description: string | null; photo_url: string | null;
  cost_cents: Cents | null; price_cents: Cents | null; active: boolean; min_stock?: number | null;
}
export interface SupplierRow extends Supplier { created_at: string }
export interface StockEntryRow { id: UUID; qty: number; cost_cents: Cents | null; supplier_name: string; created_at: string }
export interface StockEntryPayload {
  client_id?: string;
  product_id?: UUID | null;
  new_product?: { code: string; name: string; category_id?: UUID | null; description?: string | null; photo_url?: string | null } | null;
  qty: number; cost_cents?: Cents | null; price_cents?: Cents | null; supplier_id?: UUID | null; supplier_name?: string | null;
}
export interface StockEntryResult { id: UUID; product_id: UUID; product_name: string; product_code: string; prev_qty: number; new_qty: number; qty: number; supplier_name: string; cost_cents: Cents | null; queued?: boolean }
export type SalesRange = 'today' | 'yesterday' | '7d' | 'cancelled';
export interface SaleRow {
  id: UUID; number: number; status: SaleStatus; payment_method: PaymentMethod; total_cents: Cents; discount_cents: Cents;
  seller_name: string; created_at: string; pending?: boolean;
}
export interface SaleDetail extends SaleRow {
  customer_name: string | null; gross_cents: Cents; cancel_reason: string | null; cancelled_at: string | null; cancelled_by_name: string | null;
  items: (SaleItem & { photo_url?: string | null })[];
}
export interface CashSessionRow extends CashSession { opened_by_name: string; closed_by_name: string | null }
export interface DailyReport {
  date: string; sales_count: number; cancelled_count: number; sellers_count: number; gross_cents: Cents; discount_cents: Cents; net_cents: Cents; cancelled_cents: Cents;
  cancelled: { number: number; reason: string | null; total_cents: Cents }[];
  by_payment: Partial<Record<PaymentMethod, Cents>>;
  by_seller: { name: string; count: number; total_cents: Cents }[];
  products: { name: string; qty: number }[];
}
export interface CashClose { expected_cents: Cents; counted_cents: Cents; difference_cents: Cents; closed_at: string; closed_by_name: string; opening_cents: Cents; cash_sales_cents: Cents }
export interface OutboxItem { client_id: string; kind: 'sale' | 'cancel_sale' | 'stock_entry'; status: 'pending' | 'failed' | 'rejected'; last_error: string | null; created_at: string; summary: string }
export interface SyncStatus { pending: OutboxItem[]; attention: OutboxItem[]; sentToday: { sales: number; entries: number; lastAt: string | null }; localMode: boolean }
