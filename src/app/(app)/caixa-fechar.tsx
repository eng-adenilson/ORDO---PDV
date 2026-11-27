// Tela: 15-fechar-caixa
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppBar, Banner, Button, Card, EmptyState, Screen, Text, TextField } from '@/components/ui';
import { BusinessError, closeCashSession, getCashExpected } from '@/data/repo';
import { formatMoney, parseMoney } from '@/lib/money';
import { useLoad } from '@/lib/useLoad';
import { colors } from '@/theme/tokens';

export default function FecharCaixa() {
  const { data: exp, loading, error, reload } = useLoad(getCashExpected);
  const [raw, setRaw] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!exp) {
    return (
      <View style={{ flex: 1 }}>
        <AppBar title="Fechar caixa" />
        <Screen>{loading ? <Text variant="body" color={colors.muted} style={{ textAlign: 'center', paddingVertical: 32 }}>Carregando…</Text>
          : <><EmptyState icon="cash" title={error ? 'Não foi possível carregar' : 'Nenhum caixa aberto'} message={error ?? 'Abra o caixa na aba Caixa.'} /><Button kind="ghost" label={error ? 'Tentar de novo' : 'Voltar'} onPress={error ? reload : () => router.back()} /></>}</Screen>
      </View>
    );
  }

  const counted = raw.trim() ? parseMoney(raw) : null;
  const diff = counted === null ? null : counted - exp.expected_cents;
  const rawErr = raw.trim() && counted === null ? 'Digite um valor válido. Ex.: 952,40' : undefined;

  const confirm = async () => {
    if (counted === null) return;
    setBusy(true); setErr(null);
    try {
      const r = await closeCashSession(counted, note);
      router.replace({ pathname: '/caixa-fechado', params: {
        expected: String(r.expected_cents), counted: String(r.counted_cents), diff: String(r.difference_cents), at: r.closed_at, by: r.closed_by_name, opening: String(r.opening_cents), cash: String(r.cash_sales_cents) } });
    } catch (e) { setErr(e instanceof BusinessError || e instanceof Error ? e.message : 'Não foi possível fechar o caixa.'); }
    finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Fechar caixa" />
      <Screen footer={<View style={{ gap: 8 }}>
        {counted === null ? <Text variant="caption" color={colors.muted}>Digite quanto você contou na gaveta para confirmar.</Text> : null}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Button kind="ghost" label="Contar de novo" onPress={() => setRaw('')} /></View>
          <View style={{ flex: 1.4 }}><Button label="Confirmar fechamento" loading={busy} disabled={counted === null} accessibilityHint="Digite o valor contado" onPress={confirm} /></View>
        </View>
      </View>}>
        {err ? <Banner tone="danger" title={err} /> : null}
        <Card style={{ gap: 10 }}>
          <Row k="Troco inicial" v={formatMoney(exp.opening_cents)} />
          <Row k="+ Vendas em dinheiro" v={formatMoney(exp.cash_sales_cents)} />
          <View style={{ height: 1, backgroundColor: colors.line }} />
          <Row k="Esperado na gaveta" v={formatMoney(exp.expected_cents)} strong />
        </Card>
        <TextField label="Quanto você contou na gaveta?" required value={raw} onChangeText={setRaw} keyboardType="decimal-pad" autoFocus placeholder="Ex.: 952,40" error={rawErr} hint="Conte as notas e moedas antes de digitar." />
        {diff !== null ? (
          diff === 0 ? <Banner tone="ok" title="Caixa confere" />
            : diff < 0 ? <Banner tone="danger" title={`Falta ${formatMoney(-diff)}`} message="O valor contado é menor que o esperado." />
              : <Banner tone="warn" icon="alert" title={`Sobra ${formatMoney(diff)}`} message="O valor contado é maior que o esperado." />
        ) : null}
        <TextField label="Observação (opcional)" value={note} onChangeText={setNote} multiline placeholder="Ex.: troco devolvido ao gerente" />
      </Screen>
    </View>
  );
}

const Row = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text variant={strong ? 'bodyStrong' : 'body'} color={strong ? colors.ink : colors.muted}>{k}</Text><Text variant={strong ? 'section' : 'money'}>{v}</Text></View>
);
