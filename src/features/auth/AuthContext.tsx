import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';

type AuthUser = { id: string; name: string };
type Ctx = { user: AuthUser | null; loading: boolean; signIn: (login: string, password: string) => Promise<string | null>; signOut: () => Promise<void> };

const AuthCtx = createContext<Ctx | null>(null);

/** Login "joao.balcao" vira "joao.balcao@ordo.local" (crie os usuários assim no Supabase) — ver SPEC §7.1. */
export const toEmail = (login: string) => (login.includes('@') ? login.trim() : `${login.trim().toLowerCase()}@ordo.local`);

function fromSession(s: Session | null): AuthUser | null {
  if (!s) return null;
  const name = (s.user.user_metadata?.name as string | undefined) ?? s.user.email?.split('@')[0] ?? 'Vendedor';
  return { id: s.user.id, name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;
    supabase.auth.getSession().then(({ data }) => { setUser(fromSession(data.session)); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(fromSession(s)));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn: Ctx['signIn'] = async (login, password) => {
    if (isDemo) { setUser({ id: 'demo-joao', name: 'João' }); return null; }
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(login), password });
    return error ? 'Usuário ou senha incorretos.' : null;
  };
  const signOut = async () => { if (!isDemo) await supabase.auth.signOut(); setUser(null); };

  return <AuthCtx.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth fora do AuthProvider');
  return v;
}
