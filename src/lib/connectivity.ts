import { useNetInfo } from '@react-native-community/netinfo';

/** true quando o aparelho está sem internet — mostra a faixa "Sem internet · N vendas aguardando envio". */
export function useIsOffline() {
  const n = useNetInfo();
  return n.isConnected === false || n.isInternetReachable === false;
}
