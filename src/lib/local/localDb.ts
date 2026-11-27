import { randomUUID } from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { createEngine, type Engine } from './engine';
import type { Db } from './schema';

/**
 * Banco do modo local (sem Supabase): arquivo `ordo-local.db` no próprio aparelho, via expo-sqlite.
 * Abre uma vez, cria as tabelas e o catálogo inicial, e devolve o motor (engine) com as regras.
 */
let engine: Promise<Engine> | null = null;
let rawDb: Promise<SQLite.SQLiteDatabase> | null = null;

export function getLocalDb() {
  if (!rawDb) rawDb = SQLite.openDatabaseAsync('ordo-local.db').then(async (d) => { await d.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = OFF;'); return d; });
  return rawDb;
}

export function getEngine(): Promise<Engine> {
  if (!engine) {
    engine = getLocalDb().then(async (d) => {
      const e = createEngine({ db: d as unknown as Db, uuid: randomUUID });
      await e.init();
      return e;
    });
    engine.catch(() => { engine = null; }); // permite nova tentativa se a abertura falhar
  }
  return engine;
}
