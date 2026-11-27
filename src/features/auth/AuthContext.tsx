import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setRepoActor } from '@/data/repo';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { createLocalAuth, toEmail, type AuthUser } from './localAuth';
import { createSupabaseAuth } from './supabaseAuth';

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

const isDeviceOffline = async () => {
  try {
    const net = await NetInfo.fetch();
    return net.isConnected === false || net.isInternetReachable === false;
  } catch {
    return false;
  }
};

const supabaseAuth = createSupabaseAuth(supabase.auth, AsyncStorage, isDeviceOffline);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (isDemo) {
      localAuth.getSession().then((u) => {
        if (active) { setUser(u); setLoading(false); }
      });
      return () => { active = false; };
    }

    supabaseAuth.restoreSession().then((u) => {
      if (active) { setUser(u); setLoading(false); }
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      supabaseAuth.syncFromEvent(event, s).then((u) => {
        if (active) setUser(u);
      });
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { setRepoActor(user ? { id: user.id, name: user.name } : null); }, [user]);

  const signIn: Ctx['signIn'] = async (login, password) => {
    if (isDemo) {
      const res = await localAuth.signIn(login, password);
      if (res.user) setUser(res.user);
      return res.error;
    }
    const res = await supabaseAuth.signIn(login, password);
    if (res.user) setUser(res.user);
    return res.error;
  };

  const registerLocal: Ctx['registerLocal'] = async (input) => {
    if (!isDemo) return 'Cadastro local disponível apenas no modo offline/local.';
    const res = await localAuth.register(input);
    if (res.user) setUser(res.user);
    return res.error;
  };

  const signOut = async () => {
    if (isDemo) await localAuth.signOut();
    else await supabaseAuth.signOut();
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
