import { createRequire } from 'node:module';
import type { Db } from '../schema.ts';

const require = createRequire(import.meta.url);

/** Adaptador de teste: sql.js (SQLite em WASM) com a mesma interface assíncrona do expo-sqlite. */
export async function createTestDb(): Promise<Db> {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const raw = new SQL.Database();
  return {
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, params = []) { raw.run(sql, params as never[]); },
    async getAllAsync<T>(sql: string, params: unknown[] = []) {
      const st = raw.prepare(sql); st.bind(params as never[]);
      const rows: T[] = [];
      while (st.step()) rows.push(st.getAsObject() as T);
      st.free();
      return rows;
    },
    async getFirstAsync<T>(sql: string, params: unknown[] = []) {
      const st = raw.prepare(sql); st.bind(params as never[]);
      const row = st.step() ? (st.getAsObject() as T) : null;
      st.free();
      return row;
    },
    async withTransactionAsync(fn) {
      raw.run('BEGIN');
      try { await fn(); raw.run('COMMIT'); } catch (e) { raw.run('ROLLBACK'); throw e; }
    },
  };
}
