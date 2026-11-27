// Telas: 10a-abrir-caixa · 10-relatorio-diario-caixa
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBar, Banner, Button, Card, Chip, EmptyState, Icon, Logo, Screen, Text, TextField, type IconName } from '@/components/ui';
import { BusinessError, getCashExpected, getDailyReport, getLastClosedSession, getOpenCashSession, openCashSession } from '@/data/repo';
import { useAuth } from '@/features/auth/AuthContext';
import { exportDayReport } from '@/features/cash/exportReport';
import { ExportSheet, type ExportedFile } from '@/features/common/ExportSheet';
import { formatFullDate, formatTime, plural } from '@/lib/format';
import { formatMoney, parseMoney } from '@/lib/money';
import { useLoad } from '@/lib/useLoad';
import { colors, radius } from '@/theme/tokens';
import { PAYMENT_LABEL, type PaymentMethod } from '@/types/domain';

const PAY_ICON: Record<PaymentMethod, IconName> = { pix: 'pix', dinheiro: 'cash', credito: 'card', debito: 'card' };

export default function Caixa() {
  const state = useLoad(async () => {
    const session = await getOpenCashSession();
    if (!session) return { session: null, last: await getLastClosedSession() } as const;
    const [report, exp] = await Promise.all([getDailyReport(), getCashExpected()]);
    return { session, report, exp } as const;
  });
  const d = state.data;

  if (!d) {
    return (
      <View style={{ flex: 1 }}>
        <AppBar title="Caixa" back={false} />
        <Screen>
          {state.loading ? <Text variant="body" color={colors.muted} style={{ textAlign: 'center', paddingVertical: 32 }}>Carregando caixa…</Text>
            : <><EmptyState icon="alert" title="Não foi possível carregar o caixa" message={state.error ?? undefined} /><Button kind="ghost" label="Tentar de novo" onPress={state.reload} /></>}
        </Screen>
      </View>
    );
  }
  if (!d.session) return <OpenCash last={d.last} onOpened={state.reload} />;
  return <OpenView report={d.report} exp={d.exp} session={d.session} />;
}

function OpenCash({ last, onOpened }: { last: Awaited<ReturnType<typeof getLastClosedSession>>; onOpened: () => void }) {
  const { user } = useAuth();
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cents = raw.trim() ? parseMoney(raw) : null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const reason = cents === null ? (raw.trim() ? 'Digite um valor válido. Ex.: 150,00' : 'Informe o valor inicial para troco (pode ser 0).') : null;
  const open = async () => {
    if (cents === null) return;
    setBusy(true); setError(null);
    try { await openCashSession(cents); onOpened(); }
    catch (e) { setError(e instanceof BusinessError || e instanceof Error ? e.message : 'Não foi possível abrir o caixa.'); }
    finally { setBusy(false); }
  };
  const diff = last && last.counted_cents !== null && last.expected_cents !== null ? last.counted_cents - last.expected_cents : null;
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Abrir caixa" back={false} />
      <Screen footer={<>
        {reason ? <Text variant="caption" color={colors.muted}>{reason}</Text> : null}
        <Button large kind="brand" label="Abrir caixa" loading={busy} disabled={cents === null} accessibilityHint={reason ?? undefined} onPress={open} />
      </>}>
        <View style={styles.hello}><Logo size={40} /><View><Text variant="sheetTitle">{greeting}, {user?.name}</Text><Text variant="caption" color={colors.muted}>Vamos abrir o caixa de hoje.</Text></View></View>
        {error ? <Banner tone="danger" title={error} /> : null}
        <TextField label="Valor inicial para troco (dinheiro)" required value={raw} onChangeText={setRaw} keyboardType="decimal-pad" placeholder="Ex.: 150,00" />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[50, 100, 150, 200].map((v) => <Chip key={v} label={`R$ ${v}`} selected={cents === v * 100} onPress={() => setRaw(`${v},00`)} />)}
        </View>
        {last ? (
          <Card style={{ gap: 6 }}>
            <Text variant="label" color={colors.muted}>Último fechamento</Text>
            <Text variant="bodyStrong">{last.closed_at ? formatFullDate(last.closed_at) : ''} · {last.closed_by_name}</Text>
            <Text variant="caption" color={colors.muted}>Contado {formatMoney(last.counted_cents ?? 0)}</Text>
            {diff !== null ? <Text variant="caption" color={diff < 0 ? colors.danger : diff > 0 ? colors.warn : colors.ok}>{diff === 0 ? 'Caixa conferiu' : `Diferença ${diff < 0 ? '- ' : '+ '}${formatMoney(Math.abs(diff))}`}</Text> : null}
          </Card>
        ) : null}
      </Screen>
    </View>
  );
}

function OpenView({ report, exp, session }: { report: Awaited<ReturnType<typeof getDailyReport>>; exp: Awaited<ReturnType<typeof getCashExpected>>; session: NonNullable<Awaited<ReturnType<typeof getOpenCashSession>>> }) {
  const [file, setFile] = useState<ExportedFile>(null);
  const [err, setErr] = useState<string | null>(null);
  const doExport = async () => { setErr(null); try { setFile(await exportDayReport()); } catch { setErr('Não foi possível gerar a planilha.'); } };
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Caixa de hoje" subtitle={`Aberto às ${formatTime(session.opened_at)} por ${session.opened_by_name} · troco ${formatMoney(session.opening_cents)}`} back={false} />
      <Screen footer={<View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Button kind="ghost" label="Exportar Excel" onPress={doExport} /></View>
        <View style={{ flex: 1 }}><Button label="Fechar caixa" onPress={() => router.push('/caixa-fechar')} /></View>
      </View>}>
        {err ? <Banner tone="danger" title={err} /> : null}
        <View style={styles.dark}>
          <View style={{ flex: 1 }}>
            <Text variant="label" color="#D9D7CF">Vendas líquidas</Text>
            <Text variant="display" color="#FFFFFF" adjustsFontSizeToFit numberOfLines={1}>{formatMoney(report.net_cents)}</Text>
            <Text variant="caption" color="#D9D7CF">{plural(report.sales_count, 'venda', 'vendas')} · {plural(report.cancelled_count, 'cancelada', 'canceladas')} · {plural(report.sellers_count, 'vendedor', 'vendedores')}</Text>
          </View>
          <Logo size={32} inverted />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Mini label="Bruto" value={formatMoney(report.gross_cents)} />
          <Mini label="Descontos" value={`- ${formatMoney(report.discount_cents)}`} />
          <Mini label="Cancelado" value={formatMoney(report.cancelled_cents)} color={colors.danger} />
        </View>
        <View style={styles.sectionHead}>
          <Text variant="section">Por forma de pagamento</Text>
          <Text variant="label" onPress={() => router.push('/relatorio')} accessibilityRole="link" style={{ minHeight: 44, textAlignVertical: 'center' }}>Relatório completo ›</Text>
        </View>
        {(['pix', 'dinheiro', 'credito', 'debito'] as PaymentMethod[]).map((m) => (
          <View key={m} style={styles.pay}>
            <Icon name={PAY_ICON[m]} /><Text variant="body" style={{ flex: 1 }}>{PAYMENT_LABEL[m]}</Text><Text variant="money">{formatMoney(report.by_payment[m] ?? 0)}</Text>
          </View>
        ))}
        <Text variant="section">Fechamento</Text>
        <Card style={{ gap: 8 }}>
          <View style={styles.pay}><View style={{ flex: 1 }}><Text variant="body" color={colors.muted}>Esperado em dinheiro</Text>
            <Text variant="caption" color={colors.muted}>(troco {formatMoney(session.opening_cents)} + vendas {formatMoney(exp?.cash_sales_cents ?? 0)})</Text></View>
            <Text variant="money">{formatMoney(exp?.expected_cents ?? session.opening_cents)}</Text></View>
          <View style={styles.pay}><Text variant="body" color={colors.muted} style={{ flex: 1 }}>Contado</Text><Text variant="caption" color={colors.muted}>conte ao fechar o caixa</Text></View>
        </Card>
      </Screen>
      <ExportSheet file={file} onClose={() => setFile(null)} />
    </View>
  );
}

const Mini = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={styles.mini}><Text variant="caption" color={colors.muted}>{label}</Text><Text variant="label" color={color ?? colors.ink} numberOfLines={1} adjustsFontSizeToFit>{value}</Text></View>
);

const styles = StyleSheet.create({
  hello: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.brandSoft, borderRadius: radius.card, padding: 16 },
  dark: { backgroundColor: colors.ink, borderRadius: radius.card, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  mini: { flex: 1, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 10, gap: 4 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pay: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
});
