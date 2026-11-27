// Tela: R5-entrada-registrada
import { router, useLocalSearchParams } from 'expo-router';
import { ResultScreen } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { colors } from '@/theme/tokens';

export default function EntradaRegistrada() {
  const p = useLocalSearchParams<{ name: string; code: string; qty: string; prev: string; next: string; cost?: string; supplier: string; queued?: string }>();
  const queued = !!p.queued;
  const rows = [
    { label: 'Produto', value: p.name ?? '' },
    ...(queued ? [] : [{ label: 'Saldo', value: `${p.prev} → ${p.next}`, color: colors.ok }]),
    ...(p.cost ? [{ label: 'Custo', value: formatMoney(Number(p.cost)) }] : []),
    { label: 'Fornecedor', value: p.supplier ?? '' },
  ];
  return (
    <ResultScreen
      tone={queued ? 'warn' : 'ok'} icon={queued ? 'cloudOff' : 'check'}
      title={queued ? 'Entrada salva' : 'Entrada registrada'}
      lines={queued ? ['Sem internet agora. A entrada será enviada', 'quando a conexão voltar.'] : [`${p.qty} unidades somadas ao estoque`]}
      rows={rows}
      primary={{ label: 'Registrar outra entrada', onPress: () => router.replace('/entrada') }}
      secondary={{ label: queued ? 'Ver sincronização' : 'Ver estoque', onPress: () => router.dismissTo(queued ? '/sincronizacao' : '/estoque') }} />
  );
}
