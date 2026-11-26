// Telas: R3-venda-concluida · R4-venda-salva-offline
import { router, useLocalSearchParams } from 'expo-router';
import { ResultScreen } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { PAYMENT_LABEL, type PaymentMethod } from '@/types/domain';

export default function VendaConcluida() {
  const p = useLocalSearchParams<{ status: 'completed' | 'queued'; number?: string; total: string; method: PaymentMethod }>();
  const rows = [{ label: 'Total', value: formatMoney(Number(p.total)) }, { label: 'Pagamento', value: PAYMENT_LABEL[p.method] ?? p.method }];
  const newSale = () => router.dismissTo('/');
  if (p.status === 'queued') {
    return <ResultScreen tone="warn" icon="cloudOff" title="Venda salva" lines={['Sem internet agora. A venda ficou', 'guardada neste celular.']}
      rows={rows} note="Estoque confirmado quando a internet voltar"
      primary={{ label: 'Nova venda', onPress: newSale }} secondary={{ label: 'Ver sincronização', onPress: () => router.replace('/sincronizacao') }} />;
  }
  return <ResultScreen title="Venda concluída" lines={[`Venda #${p.number} registrada e estoque`, 'atualizado.']} rows={rows}
    primary={{ label: 'Nova venda', onPress: newSale }} secondary={{ label: 'Ver detalhes da venda', onPress: () => router.replace(`/vendas/${p.number}`) }} />;
}
