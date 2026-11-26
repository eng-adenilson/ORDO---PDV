import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { isDemo } from '@/lib/env';
import { listOutbox, markDone, markError, type OutboxKind } from './outbox';

const RPC: Record<OutboxKind, string> = { sale: 'finalize_sale', cancel_sale: 'cancel_sale', stock_entry: 'register_stock_entry' };

/** Erros de regra de negócio vindos das RPCs (RAISE EXCEPTION ... USING ERRCODE = 'P0001'). Não adianta repetir. */
const isBusinessError = (code?: string) => code === 'P0001' || code === '23505';

let running = false;

/** Envia a fila em ordem. Chamado ao voltar a internet, ao abrir o app e pelo botão "Tentar enviar agora". */
export async function syncOutbox(): Promise<{ sent: number; failed: number; rejected: number }> {
  const result = { sent: 0, failed: 0, rejected: 0 };
  if (isDemo || running) return result;
  running = true;
  try {
    for (const row of await listOutbox()) {
      if (row.status === 'rejected') continue;
      const { error } = await supabase.rpc(RPC[row.kind], { payload: JSON.parse(row.payload) });
      if (!error) { await markDone(row.client_id); result.sent++; continue; }
      if (isBusinessError(error.code)) { await markError(row.client_id, 'rejected', error.message); result.rejected++; }
      else { await markError(row.client_id, 'failed', error.message); result.failed++; break; } // rede caiu: para e tenta depois
    }
  } finally { running = false; }
  return result;
}

/** Liga a sincronização automática com novas tentativas (backoff) — chamar uma vez no layout raiz. */
export function startAutoSync() {
  let delay = 5_000;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const tick = async () => {
    const r = await syncOutbox();
    delay = r.failed ? Math.min(delay * 2, 5 * 60_000) : 5_000;
    if (r.failed) timer = setTimeout(tick, delay);
  };
  const unsub = NetInfo.addEventListener((s) => { if (s.isConnected && s.isInternetReachable !== false) void tick(); });
  return () => { unsub(); if (timer) clearTimeout(timer); };
}
