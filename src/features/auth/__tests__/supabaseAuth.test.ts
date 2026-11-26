import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { KeyValueStore } from '../localAuth.ts';
import {
  createSupabaseAuth,
  CREDENTIAL_ERROR,
  OFFLINE_LOGIN_ERROR,
  type MinimalSession,
  type SupabaseAuthAdapter,
} from '../supabaseAuth.ts';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => { data.set(k, v); },
    removeItem: async (k) => { data.delete(k); },
  };
}

function makeAdapter(opts: {
  session?: MinimalSession | null;
  getSessionError?: { message: string; name?: string; status?: number } | null;
  signInResult?: { session: MinimalSession | null; error: { message: string; name?: string; status?: number } | null };
}): { adapter: SupabaseAuthAdapter; lastEmail: () => string | null } {
  let seenEmail: string | null = null;
  return {
    lastEmail: () => seenEmail,
    adapter: {
      getSession: async () => ({ data: { session: opts.session ?? null }, error: opts.getSessionError ?? null }),
      signInWithPassword: async ({ email }) => {
        seenEmail = email;
        const res = opts.signInResult ?? { session: null, error: null };
        return { data: { session: res.session }, error: res.error };
      },
      signOut: async () => ({ error: null }),
    },
  };
}

const joaoSession: MinimalSession = {
  user: { id: 'u-joao', email: 'joao.balcao@ordo.local', user_metadata: { name: 'João' } },
};

test('login certo converte usuário para @ordo.local, entra e salva sessão para uso offline', async () => {
  const store = memoryStore();
  let offline = false;
  const { adapter, lastEmail } = makeAdapter({ signInResult: { session: joaoSession, error: null } });
  const auth = createSupabaseAuth(adapter, store, async () => offline);

  const res = await auth.signIn('joao.balcao', 'senha123');
  assert.equal(lastEmail(), 'joao.balcao@ordo.local');
  assert.equal(res.error, null);
  assert.deepEqual(res.user, { id: 'u-joao', name: 'João', email: 'joao.balcao@ordo.local' });

  // Reabre o app sem internet e mesmo se getSession() vier nulo por falha de refresh, mantém a sessão
  offline = true;
  const { adapter: offlineAdapter } = makeAdapter({
    session: null,
    getSessionError: { message: 'Network request failed', name: 'AuthRetryableFetchError', status: 0 },
  });
  const reopened = createSupabaseAuth(offlineAdapter, store, async () => offline);
  const restored = await reopened.restoreSession();
  assert.deepEqual(restored, { id: 'u-joao', name: 'João', email: 'joao.balcao@ordo.local' });
});

test('login errado retorna erro R1 padrão', async () => {
  const store = memoryStore();
  const { adapter } = makeAdapter({
    signInResult: { session: null, error: { message: 'Invalid login credentials', status: 400 } },
  });
  const auth = createSupabaseAuth(adapter, store, async () => false);

  const res = await auth.signIn('joao.balcao', 'errada');
  assert.equal(res.user, null);
  assert.equal(res.error, CREDENTIAL_ERROR);
});

test('login sem internet informa falta de conexão em vez de erro de senha', async () => {
  const store = memoryStore();
  const { adapter } = makeAdapter({});
  const auth = createSupabaseAuth(adapter, store, async () => true);

  const res = await auth.signIn('joao.balcao', 'senha123');
  assert.equal(res.user, null);
  assert.equal(res.error, OFFLINE_LOGIN_ERROR);
});

test('signOut limpa cache offline e reabrir online sem sessão não autentica', async () => {
  const store = memoryStore();
  let offline = false;
  const { adapter } = makeAdapter({
    session: null,
    signInResult: { session: joaoSession, error: null },
  });
  const auth = createSupabaseAuth(adapter, store, async () => offline);

  await auth.signIn('joao.balcao', 'senha123');
  // Reabrir online sem sessão ativa não usa cache obsoleto
  assert.equal(await auth.restoreSession(), null);

  await auth.signIn('joao.balcao', 'senha123');
  await auth.signOut();
  offline = true;
  assert.equal(await auth.restoreSession(), null);
});
