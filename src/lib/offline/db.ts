import * as SQLite from 'expo-sqlite';

/**
 * Banco local (expo-sqlite):
 *  - outbox: operações feitas sem internet, enviadas depois (SPEC §8).
 *  - product_cache: catálogo para busca offline (sem custo — nunca guardar cost_cents aqui).
 */
let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('ordo.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS outbox (
      client_id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS product_cache (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      search TEXT NOT NULL,
      price_cents INTEGER,
      photo_url TEXT,
      category_id TEXT,
      stock_qty INTEGER,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}
