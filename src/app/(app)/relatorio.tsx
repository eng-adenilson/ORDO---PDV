// Tela: 14-relatorio-do-dia
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBar, Banner, Button, Card, EmptyState, Screen, Text } from '@/components/ui';
import { getDailyReport } from '@/data/repo';
import { exportDayReport } from '@/features/cash/exportReport';
import { Avatar } from '@/features/common/Avatar';
import { ExportSheet, type ExportedFile } from '@/features/common/ExportSheet';
import { formatDayMonth, plural } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { useLoad } from '@/lib/useLoad';
import { colors } from '@/theme/tokens';

export default function Relatorio() {
  const { data: r, loading, error, reload } = useLoad(() => getDailyReport());
  const [all, setAll] = useState(false);
  const [file, setFile] = useState<ExportedFile>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!r) {
    return (
      <View style={{ flex: 1 }}>
        <AppBar title="Relatório do dia" />
        <Screen>{loading ? <Text variant="body" color={colors.muted} style={{ textAlign: 'center', paddingVertical: 32 }}>Carregando relatório…</Text>
          : <><EmptyState icon="alert" title="Não foi possível carregar" message={error ?? undefined} /><Button kind="ghost" label="Tentar de novo" onPress={reload} /></>}</Screen>
      </View>
    );
  }
  const shown = all ? r.products : r.products.slice(0, 4);
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Relatório do dia" subtitle={`Hoje, ${formatDayMonth()} · ${plural(r.sales_count, 'venda', 'vendas')}`} />
      <Screen footer={<Button large label="Exportar Excel" onPress={async () => { setErr(null); try { setFile(await exportDayReport()); } catch { setErr('Não foi possível gerar a planilha.'); } }} />}>
        {err ? <Banner tone="danger" title={err} /> : null}
        <Text variant="section">Produtos vendidos</Text>
        <Card style={{ gap: 10 }}>
          {r.products.length === 0 ? <Text variant="body" color={colors.muted}>Nenhuma venda hoje.</Text> : shown.map((p) => (
            <View key={p.name} style={styles.line}><Text variant="body" style={{ flex: 1 }} numberOfLines={2}>{p.name}</Text><Text variant="money">{p.qty} un</Text></View>
          ))}
          {r.products.length > 4 ? <Text variant="label" accessibilityRole="button" onPress={() => setAll(!all)} style={{ minHeight: 44, textAlignVertical: 'center' }}>{all ? 'Mostrar menos' : `Ver todos os ${r.products.length} produtos ›`}</Text> : null}
        </Card>
        <Text variant="section">Cancelamentos</Text>
        <Card style={{ gap: 10 }}>
          {r.cancelled.length === 0 ? <Text variant="body" color={colors.muted}>Nenhum cancelamento hoje.</Text> : r.cancelled.map((c) => (
            <View key={c.number} style={styles.line}>
              <View style={{ flex: 1 }}><Text variant="bodyStrong">Venda #{c.number}</Text><Text variant="caption" color={colors.muted}>{c.reason}</Text></View>
              <Text variant="money" color={colors.danger}>{formatMoney(c.total_cents)}</Text>
            </View>
          ))}
        </Card>
        <Text variant="section">Por vendedor</Text>
        <Card style={{ gap: 10 }}>
          {r.by_seller.length === 0 ? <Text variant="body" color={colors.muted}>Sem vendas hoje.</Text> : r.by_seller.map((s) => (
            <View key={s.name} style={styles.line}>
              <Avatar name={s.name} size={36} />
              <View style={{ flex: 1 }}><Text variant="bodyStrong">{s.name}</Text><Text variant="caption" color={colors.muted}>{plural(s.count, 'venda', 'vendas')}</Text></View>
              <Text variant="money">{formatMoney(s.total_cents)}</Text>
            </View>
          ))}
        </Card>
      </Screen>
      <ExportSheet file={file} onClose={() => setFile(null)} />
    </View>
  );
}

const styles = StyleSheet.create({ line: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 } });
