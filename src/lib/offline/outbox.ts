import { randomUUID } from 'expo-crypto';
import { getDb } from './db';

export type OutboxKind = 'sale' | 'cancel_sale' | 'stock_entry';
export type OutboxStatus = 'pending' | 'failed' | 'rejected';
export interface OutboxRow { client_id: string; kind: OutboxKind; payload: string; status: OutboxStatus; attempts: number; last_error: string | null; created_at: string }

/** Enfileira uma operação. `client_id` garante idempotência: o servidor ignora repetição do mesmo id. */
export async function enqueue(kind: OutboxKind, payload: object, clientId = randomUUID()) {
  const db = await getDb();
  await db.runAsync('INSERT INTO outbox (client_id, kind, payload, created_at) VALUES (?, ?, ?, ?)',
    clientId, kind, JSON.stringify({ ...payload, client_id: clientId }), new Date().toISOString());
  return clientId;
}

export async function listOutbox(): Promise<OutboxRow[]> {
  const db = await getDb();
  return db.getAllAsync<OutboxRow>('SELECT * FROM outbox ORDER BY created_at');
}

export async function markDone(clientId: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM outbox WHERE client_id = ?', clientId);
}

/** failed = erro de rede/temporário (tentar de novo); rejected = servidor recusou (ex.: sem estoque) → exige ação do vendedor. */
export async function markError(clientId: string, status: Exclude<OutboxStatus, 'pending'>, message: string) {
  const db = await getDb();
  await db.runAsync('UPDATE outbox SET status = ?, attempts = attempts + 1, last_error = ? WHERE client_id = ?', status, message, clientId);
}
