import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createLocalAuth, DEFAULT_LOCAL_PASSWORD, sha256Hex, toEmail, type KeyValueStore } from '../localAuth.ts';

function memoryStore(): { store: KeyValueStore; data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    store: {
      getItem: async (k) => data.get(k) ?? null,
      setItem: async (k, v) => { data.set(k, v); },
      removeItem: async (k) => { data.delete(k); },
    },
  };
}

test('sha256Hex bate com crypto nativo para ASCII e UTF-8', () => {
  for (const sample of ['', '123456', 'seed-joao:123456', 'João@ORDO-ção!']) {
    const expected = createHash('sha256').update(sample, 'utf8').digest('hex');
    assert.equal(sha256Hex(sample), expected);
  }
});

test('toEmail normaliza login local e preserva domínio quando informado', () => {
  assert.equal(toEmail(' joao.balcao '), 'joao.balcao@ordo.local');
  assert.equal(toEmail('CARLA'), 'carla@ordo.local');
  assert.equal(toEmail('Maria@Ordo.Local'), 'maria@ordo.local');
});

test('login local valida senha, persiste sessão offline e limpa no signOut', async () => {
  const { store } = memoryStore();
  const auth = createLocalAuth(store);

  assert.equal(await auth.getSession(), null);

  const badPass = await auth.signIn('joao.balcao', 'errada');
  assert.equal(badPass.user, null);
  assert.equal(badPass.error, 'Usuário ou senha incorretos.');

  const badUser = await auth.signIn('desconhecido', DEFAULT_LOCAL_PASSWORD);
  assert.equal(badUser.user, null);
  assert.equal(badUser.error, 'Usuário ou senha incorretos.');

  const ok = await auth.signIn('carla', DEFAULT_LOCAL_PASSWORD);
  assert.equal(ok.error, null);
  assert.equal(ok.user?.name, 'Carla');

  // Nova instância usando o mesmo storage restaura a sessão salva
  const reloaded = createLocalAuth(store);
  const session = await reloaded.getSession();
  assert.equal(session?.name, 'Carla');

  await reloaded.signOut();
  assert.equal(await reloaded.getSession(), null);
});

test('cadastro local cria usuário sem Google, evita duplicidade e não grava senha em texto puro', async () => {
  const { store, data } = memoryStore();
  const auth = createLocalAuth(store);

  const created = await auth.register({ name: 'Maria', login: 'maria.caixa', password: 'segredo99' });
  assert.equal(created.error, null);
  assert.equal(created.user?.name, 'Maria');
  assert.equal(created.user?.email, 'maria.caixa@ordo.local');

  const rawUsers = data.get('ordo:local_users_v1') ?? '';
  assert.equal(rawUsers.includes('segredo99'), false);

  const duplicate = await auth.register({ name: 'Outra Maria', login: 'maria.caixa', password: 'abcd' });
  assert.equal(duplicate.user, null);
  assert.equal(duplicate.error, 'Já existe um usuário com esse login.');

  await auth.signOut();
  const loginNew = await auth.signIn('maria.caixa@ordo.local', 'segredo99');
  assert.equal(loginNew.error, null);
  assert.equal(loginNew.user?.name, 'Maria');
});
