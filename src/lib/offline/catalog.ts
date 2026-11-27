import { searchTokens } from '@/lib/voice/parseQuery';
import type { SaleProduct } from '@/types/domain';
import { getDb } from './db';

/**
 * Cache do catálogo para a grade e a busca funcionarem sem internet (SPEC §8, issue 4).
 * Guarda só o que a tela de vendas pode ver — NUNCA custo nem estoque.
 */
type Row = { id: string; code: string; name: string; price_cents: number | null; photo_url: string | null; category_id: string | null };

export async function writeProductCache(list: SaleProduct[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM product_cache');
    for (const p of list) {
      await db.runAsync('INSERT INTO product_cache (id, code, name, search, price_cents, photo_url, category_id, updated_at) VALUES (?,?,?,?,?,?,?,?)',
        p.id, p.code, p.name, searchTokens(`${p.name} ${p.code}`).join(' '), p.price_cents, p.photo_url, p.category_id, now);
    }
  });
}

export async function readCachedProducts(categoryId?: string | null): Promise<SaleProduct[]> {
  const db = await getDb();
  const rows = categoryId
    ? await db.getAllAsync<Row>('SELECT id, code, name, price_cents, photo_url, category_id FROM product_cache WHERE category_id = ? ORDER BY name', categoryId)
    : await db.getAllAsync<Row>('SELECT id, code, name, price_cents, photo_url, category_id FROM product_cache ORDER BY name');
  return rows;
}

export async function searchCachedProducts(query: string): Promise<SaleProduct[]> {
  const toks = searchTokens(query);
  if (!toks.length) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<Row & { search: string }>('SELECT id, code, name, price_cents, photo_url, category_id, search FROM product_cache ORDER BY name');
  return rows.filter((r) => toks.every((t) => r.search.includes(t))).slice(0, 30).map(({ search: _s, ...p }) => p);
}
