import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { createLocalAuth, toEmail, type AuthUser } from './localAuth';

export { toEmail, type AuthUser };

type RegisterInput = { name: string; login: string; password: string };
type Ctx = {
  user: AuthUser | null;
  loading: boolean;
  isLocalMode: boolean;
  signIn: (login: string, password: string) => Promise<string | null>;
  registerLocal: (input: RegisterInput) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);
const localAuth = createLocalAuth(AsyncStorage);

function fromSession(s: Session | null): AuthUser | null {
  if (!s) return null;
  const name = (s.user.user_metadata?.name as string | undefined) ?? s.user.email?.split('@')[0] ?? 'Vendedor';
  return { id: s.user.id, name, email: s.user.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      localAuth.getSession().then((u) => { setUser(u); setLoading(false); });
      return;
    }
    supabase.auth.getSession().then(({ data }) => { setUser(fromSession(data.session)); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(fromSession(s)));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn: Ctx['signIn'] = async (login, password) => {
    if (isDemo) {
      const res = await localAuth.signIn(login, password);
      if (res.user) setUser(res.user);
      return res.error;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(login), password });
    return error ? 'Usuário ou senha incorretos.' : null;
  };

  const registerLocal: Ctx['registerLocal'] = async (input) => {
    if (!isDemo) return 'Cadastro local disponível apenas no modo offline/local.';
    const res = await localAuth.register(input);
    if (res.user) setUser(res.user);
    return res.error;
  };

  const signOut = async () => {
    if (isDemo) await localAuth.signOut();
    else await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, isLocalMode: isDemo, signIn, registerLocal, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth fora do AuthProvider');
  return v;
}
