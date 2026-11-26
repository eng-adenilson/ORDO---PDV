import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env, isDemo } from './env';

/** Cliente único. Em modo demo (sem .env) aponta para um host inválido e não deve ser usado. */
export const supabase = createClient(isDemo ? 'https://demo.invalid' : env.supabaseUrl, isDemo ? 'demo' : env.supabaseAnonKey, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
