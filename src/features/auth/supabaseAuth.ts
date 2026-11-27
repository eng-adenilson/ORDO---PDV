import { toEmail, type AuthUser, type KeyValueStore } from './localAuth';

export const CREDENTIAL_ERROR = 'Usuário ou senha incorretos.';
export const OFFLINE_LOGIN_ERROR = 'Sem internet para entrar. Conecte-se no primeiro acesso.';
const CACHED_USER_KEY = 'ordo:supabase_cached_user_v1';

export type MinimalSession = {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
};

export type SupabaseAuthError = {
  message?: string;
  status?: number;
  name?: string;
};

export type SupabaseAuthAdapter = {
  getSession: () => Promise<{ data: { session: MinimalSession | null }; error?: SupabaseAuthError | null }>;
  signInWithPassword: (creds: {
    email: string;
    password: string;
  }) => Promise<{ data: { session: MinimalSession | null }; error: SupabaseAuthError | null }>;
  signOut: () => Promise<{ error?: unknown }>;
};

export function fromSupabaseSession(session: MinimalSession | null): AuthUser | null {
  if (!session) return null;
  const rawName = session.user.user_metadata?.name;
  const name = typeof rawName === 'string' && rawName.trim() ? rawName : session.user.email?.split('@')[0] ?? 'Vendedor';
  return { id: session.user.id, name, email: session.user.email };
}

export function isNetworkAuthError(error: SupabaseAuthError | null | undefined): boolean {
  if (!error) return false;
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return true;
  const msg = (error.message ?? '').toLowerCase();
  return msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('failed to connect');
}

/**
 * Gerencia sessão do Supabase com fallback offline em AsyncStorage:
 * após o primeiro login online, reabrir o app sem internet mantém o usuário logado.
 */
export function createSupabaseAuth(
  adapter: SupabaseAuthAdapter,
  store: KeyValueStore,
  isOffline: () => Promise<boolean>,
) {
  async function cacheUser(user: AuthUser | null): Promise<void> {
    if (user) await store.setItem(CACHED_USER_KEY, JSON.stringify(user));
    else await store.removeItem(CACHED_USER_KEY);
  }

  async function readCachedUser(): Promise<AuthUser | null> {
    const raw = await store.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthUser;
      return parsed?.id && parsed?.name ? parsed : null;
    } catch {
      return null;
    }
  }

  async function restoreSession(): Promise<AuthUser | null> {
    try {
      const { data, error } = await adapter.getSession();
      const user = fromSupabaseSession(data.session);
      if (user) {
        await cacheUser(user);
        return user;
      }
      if (error && (isNetworkAuthError(error) || (await isOffline()))) {
        return readCachedUser();
      }
      if (await isOffline()) {
        return readCachedUser();
      }
      await cacheUser(null);
      return null;
    } catch {
      return (await isOffline()) ? readCachedUser() : null;
    }
  }

  async function signIn(login: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const cleanLogin = login.trim();
    if (!cleanLogin || !password) return { user: null, error: 'Informe usuário e senha.' };
    if (await isOffline()) return { user: null, error: OFFLINE_LOGIN_ERROR };

    try {
      const { data, error } = await adapter.signInWithPassword({ email: toEmail(cleanLogin), password });
      if (error) {
        return { user: null, error: isNetworkAuthError(error) ? OFFLINE_LOGIN_ERROR : CREDENTIAL_ERROR };
      }
      const user = fromSupabaseSession(data.session);
      if (user) await cacheUser(user);
      return { user, error: null };
    } catch {
      return { user: null, error: OFFLINE_LOGIN_ERROR };
    }
  }

  async function syncFromEvent(event: string, session: MinimalSession | null): Promise<AuthUser | null> {
    if (event === 'SIGNED_OUT') {
      await cacheUser(null);
      return null;
    }
    const user = fromSupabaseSession(session);
    if (user) {
      await cacheUser(user);
      return user;
    }
    if (await isOffline()) {
      return readCachedUser();
    }
    return null;
  }

  async function signOut(): Promise<void> {
    await cacheUser(null);
    try {
      await adapter.signOut();
    } catch {
      // Mesmo offline, sair limpa a sessão local imediatamente.
    }
  }

  return { restoreSession, signIn, syncFromEvent, signOut };
}
