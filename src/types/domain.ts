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
