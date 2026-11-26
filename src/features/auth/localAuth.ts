/**
 * Autenticação local (sem Google, sem nuvem), persistida no aparelho via KeyValueStore (AsyncStorage).
 * Garante login com usuário e senha reais mesmo sem Supabase remoto configurado.
 */

export type AuthUser = { id: string; name: string; email?: string };

export type KeyValueStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

type StoredLocalUser = {
  id: string;
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
};

const USERS_KEY = 'ordo:local_users_v1';
const SESSION_KEY = 'ordo:local_session_v1';

export const DEFAULT_LOCAL_PASSWORD = '123456';

/** Login "joao.balcao" vira "joao.balcao@ordo.local" (crie os usuários assim no Supabase) — ver SPEC §7.1. */
export const toEmail = (login: string) => {
  const clean = login.trim().toLowerCase();
  return clean.includes('@') ? clean : `${clean}@ordo.local`;
};

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

/** SHA-256 em TypeScript puro para funcionar de forma idêntica em Hermes (RN), Web e Node. */
export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const buf = new Uint8Array(paddedLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const w15 = w[i - 15]!;
      const w2 = w[i - 2]!;
      const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3);
      const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i]! + w[i]!) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7].map((n) => n.toString(16).padStart(8, '0')).join('');
}

function randomHex(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteCount; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hashPassword(password: string, salt: string): string {
  return sha256Hex(`${salt}:${password}`);
}

function makeSeedUsers(): StoredLocalUser[] {
  const now = new Date().toISOString();
  return [
    {
      id: '00000000-0000-0000-0000-00000000000a',
      name: 'João',
      email: toEmail('joao.balcao'),
      salt: 'seed-joao',
      passwordHash: hashPassword(DEFAULT_LOCAL_PASSWORD, 'seed-joao'),
      createdAt: now,
    },
    {
      id: '00000000-0000-0000-0000-00000000000b',
      name: 'Carla',
      email: toEmail('carla'),
      salt: 'seed-carla',
      passwordHash: hashPassword(DEFAULT_LOCAL_PASSWORD, 'seed-carla'),
      createdAt: now,
    },
  ];
}

function toAuthUser(u: Pick<StoredLocalUser, 'id' | 'name' | 'email'>): AuthUser {
  return { id: u.id, name: u.name, email: u.email };
}

export function createLocalAuth(store: KeyValueStore) {
  async function loadUsers(): Promise<StoredLocalUser[]> {
    const raw = await store.getItem(USERS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredLocalUser[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Re-inicializa se o JSON local estiver corrompido.
      }
    }
    const seeded = makeSeedUsers();
    await store.setItem(USERS_KEY, JSON.stringify(seeded));
    return seeded;
  }

  async function saveSession(user: AuthUser): Promise<void> {
    await store.setItem(SESSION_KEY, JSON.stringify(user));
  }

  async function getSession(): Promise<AuthUser | null> {
    const raw = await store.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const sessionUser = JSON.parse(raw) as AuthUser;
      const users = await loadUsers();
      const match = users.find((u) => u.id === sessionUser.id);
      return match ? toAuthUser(match) : null;
    } catch {
      return null;
    }
  }

  async function signIn(login: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const cleanLogin = login.trim();
    if (!cleanLogin || !password) return { user: null, error: 'Informe usuário e senha.' };
    const email = toEmail(cleanLogin);
    const users = await loadUsers();
    const found = users.find((u) => u.email === email);
    if (!found || hashPassword(password, found.salt) !== found.passwordHash) {
      return { user: null, error: 'Usuário ou senha incorretos.' };
    }
    const authUser = toAuthUser(found);
    await saveSession(authUser);
    return { user: authUser, error: null };
  }

  async function register(input: { name: string; login: string; password: string }): Promise<{ user: AuthUser | null; error: string | null }> {
    const name = input.name.trim();
    const cleanLogin = input.login.trim();
    const password = input.password;

    if (!name) return { user: null, error: 'Informe o nome do vendedor.' };
    if (!cleanLogin || /\s/.test(cleanLogin)) return { user: null, error: 'Informe um usuário sem espaços.' };
    if (password.length < 4) return { user: null, error: 'A senha deve ter pelo menos 4 caracteres.' };

    const email = toEmail(cleanLogin);
    const users = await loadUsers();
    if (users.some((u) => u.email === email)) {
      return { user: null, error: 'Já existe um usuário com esse login.' };
    }

    const salt = randomHex(8);
    const created: StoredLocalUser = {
      id: `local-${randomHex(8)}`,
      name,
      email,
      salt,
      passwordHash: hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };
    await store.setItem(USERS_KEY, JSON.stringify([...users, created]));
    const authUser = toAuthUser(created);
    await saveSession(authUser);
    return { user: authUser, error: null };
  }

  async function signOut(): Promise<void> {
    await store.removeItem(SESSION_KEY);
  }

  async function listUsers(): Promise<AuthUser[]> {
    const users = await loadUsers();
    return users.map(toAuthUser);
  }

  return { getSession, signIn, register, signOut, listUsers };
}
