/**
 * Banco local do ORDO (SQLite). No modo local ele é a "fonte da verdade": estoque, vendas, caixa etc.
 * Mesmo esquema lógico do Supabase (supabase/migrations/0001_schema.sql), em SQLite.
 * Dinheiro em CENTAVOS (inteiro). Estoque em unidades inteiras.
 */
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}

export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT,
  description TEXT,
  photo_url TEXT,
  cost_cents INTEGER CHECK (cost_cents >= 0),
  price_cents INTEGER CHECK (price_cents >= 0),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  min_stock INTEGER CHECK (min_stock >= 0),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  opened_by TEXT NOT NULL, opened_by_name TEXT NOT NULL, opened_at TEXT NOT NULL, opening_cents INTEGER NOT NULL,
  closed_by TEXT, closed_by_name TEXT, closed_at TEXT, counted_cents INTEGER, expected_cents INTEGER, note TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_cash ON cash_sessions ((1)) WHERE closed_at IS NULL;
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY NOT NULL,
  number INTEGER NOT NULL UNIQUE,
  client_id TEXT NOT NULL UNIQUE,
  seller_id TEXT NOT NULL, seller_name TEXT NOT NULL,
  customer_id TEXT, customer_name TEXT,
  cash_session_id TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix','dinheiro','credito','debito')),
  gross_cents INTEGER NOT NULL, discount_cents INTEGER NOT NULL, total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','cancelled')),
  cancel_reason TEXT, cancelled_at TEXT, cancelled_by_name TEXT,
  day TEXT NOT NULL, created_at TEXT NOT NULL,
  CHECK (status = 'completed' OR (cancel_reason IS NOT NULL AND length(trim(cancel_reason)) > 0))
);
CREATE INDEX IF NOT EXISTS sales_day ON sales (day);
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY NOT NULL, sale_id TEXT NOT NULL, product_id TEXT NOT NULL, product_name TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0), unit_price_cents INTEGER NOT NULL,
  discount_type TEXT, discount_value REAL, line_total_cents INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sale_items_sale ON sale_items (sale_id);
CREATE TABLE IF NOT EXISTS stock_entries (
  id TEXT PRIMARY KEY NOT NULL, client_id TEXT UNIQUE, product_id TEXT NOT NULL, qty INTEGER NOT NULL CHECK (qty > 0),
  prev_qty INTEGER NOT NULL, cost_cents INTEGER, price_cents INTEGER,
  supplier_id TEXT NOT NULL, supplier_name TEXT NOT NULL, user_id TEXT NOT NULL, user_name TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY NOT NULL, product_id TEXT NOT NULL, delta INTEGER NOT NULL, reason TEXT NOT NULL,
  ref_id TEXT, user_id TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
  client_id TEXT PRIMARY KEY NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_cache (
  id TEXT PRIMARY KEY NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, search TEXT NOT NULL,
  price_cents INTEGER, photo_url TEXT, category_id TEXT, stock_qty INTEGER, updated_at TEXT NOT NULL
);
`;
