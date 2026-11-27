import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

/**
 * Carrega dados ao abrir/voltar para a tela e expõe estados: carregando, erro, recarregar.
 * Regra do SPEC §4.6: toda tela mostra carregando / vazio / erro.
 */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    setLoading(true);
    try { setData(await fnRef.current()); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro inesperado.'); }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { void reload(); }, [reload, ...deps]));
  return { data, loading, error, reload, setData };
}
