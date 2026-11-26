export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};
/** Sem .env o app roda em modo demonstração com src/data/demo.ts. */
export const isDemo = !env.supabaseUrl || !env.supabaseAnonKey;
