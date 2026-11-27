import { demoCategories, demoCustomers, demoProducts } from '../../data/demo.ts';

export const demoSuppliers = [
  { id: 's1', name: 'Aço Forte Distribuidora' },
  { id: 's2', name: 'Hidro Center Atacado' },
  { id: 's3', name: 'Construmat Brasília' },
];

/** Gera os INSERTs do catálogo inicial (SPEC §11). Roda uma vez, na criação do banco local. */
export function seedStatements(nowIso: string): { sql: string; params: unknown[] }[] {
  const out: { sql: string; params: unknown[] }[] = [];
  for (const c of demoCategories) out.push({ sql: 'INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)', params: [c.id, c.name] });
  for (const s of demoSuppliers) out.push({ sql: 'INSERT OR IGNORE INTO suppliers (id, name, created_at) VALUES (?, ?, ?)', params: [s.id, s.name, nowIso] });
  for (const c of demoCustomers) out.push({ sql: 'INSERT OR IGNORE INTO customers (id, name, phone, created_at) VALUES (?, ?, ?, ?)', params: [c.id, c.name, c.phone, c.created_at] });
  for (const p of demoProducts) {
    out.push({
      sql: `INSERT OR IGNORE INTO products (id, code, name, category_id, description, photo_url, cost_cents, price_cents, stock_qty, min_stock, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [p.id, p.code, p.name, p.category_id, p.description, p.photo_url, p.cost_cents, p.price_cents, p.stock_qty, p.min_stock, p.active ? 1 : 0, nowIso, nowIso],
    });
  }
  return out;
}
