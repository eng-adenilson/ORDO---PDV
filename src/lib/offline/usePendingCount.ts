import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { isDemo } from '@/lib/env';
import { listOutbox } from './outbox';

/** Quantas operações aguardam envio (faixa de offline e tela Sincronização). */
export function usePendingCount() {
  const [count, setCount] = useState(0);
  useFocusEffect(useCallback(() => {
    if (isDemo) return;
    let alive = true;
    listOutbox().then((r) => { if (alive) setCount(r.length); }).catch(() => {});
    return () => { alive = false; };
  }, []));
  return count;
}
