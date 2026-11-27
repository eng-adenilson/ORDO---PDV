// Tela: 09-historico-vendas
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppBar, Badge, Button, Chip, EmptyState, Text } from '@/components/ui';
import { listSales } from '@/data/repo';
import { formatDayMonth, formatTime, plural } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { useLoad } from '@/lib/useLoad';
import { colors, radius } from '@/theme/tokens';
import { PAYMENT_LABEL, type SalesRange } from '@/types/domain';

const RANGES: { id: SalesRange; label: string }[] = [
  { id: 'today', label: 'Hoje' }, { id: 'yesterday', label: 'Ontem' }, { id: '7d', label: '7 dias' }, { id: 'cancelled', label: 'Canceladas' },
];

export default function Historico() {
  const [range, setRange] = useState<SalesRange>('today');
  const { data, loading, error, reload } = useLoad(() => listSales(range), [range]);
  const subtitle = data ? `${range === 'today' ? `Hoje, ${formatDayMonth()}` : RANGES.find((r) => r.id === range)!.label} · ${plural(data.length, 'venda', 'vendas')}` : undefined;

  return (
    <View style={styles.root}>
      <AppBar title="Histórico" subtitle={subtitle} back={false} />
      <FlatList
        data={data ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshing={loading && !!data}
        onRefresh={reload}
        ListHeaderComponent={
          <View style={styles.chips}>{RANGES.map((r) => <Chip key={r.id} label={r.label} selected={range === r.id} onPress={() => setRange(r.id)} />)}</View>
        }
        ListEmptyComponent={
          loading ? <Text variant="body" color={colors.muted} style={styles.center}>Carregando vendas…</Text>
            : error ? <View style={{ gap: 12 }}><EmptyState icon="alert" title="Não foi possível carregar" message={error} /><Button kind="ghost" label="Tentar de novo" onPress={reload} /></View>
              : <EmptyState icon="clock" title={range === 'cancelled' ? 'Nenhuma venda cancelada' : 'Nenhuma venda neste período'} message={range === 'today' ? 'As vendas de hoje aparecem aqui.' : undefined} />
        }
        renderItem={({ item }) => {
          const cancelled = item.status === 'cancelled';
          return (
            <Pressable accessibilityRole="button" disabled={item.pending}
              accessibilityLabel={item.pending ? 'Venda aguardando envio' : `Venda ${item.number}${cancelled ? ' cancelada' : ''}, ${formatMoney(item.total_cents)}`}
              onPress={() => router.push({ pathname: '/vendas/[id]', params: { id: item.id } })} style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{item.pending ? 'Venda salva neste aparelho' : `Venda #${item.number}`}</Text>
                <Text variant="caption" color={colors.muted}>{formatTime(item.created_at)} · {item.seller_name} · {PAYMENT_LABEL[item.payment_method]}</Text>
                {cancelled ? <Badge label="Cancelada" tone="out" /> : item.pending ? <Badge label="Aguardando envio" tone="pending" /> : null}
              </View>
              {item.pending ? null : (
                <Text variant="money" color={cancelled ? colors.muted : colors.ink} style={cancelled ? { textDecorationLine: 'line-through' } : undefined}>{formatMoney(item.total_cents)}</Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  row: { minHeight: 72, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  center: { textAlign: 'center', paddingVertical: 32 },
});
