// Telas: 08-consulta-estoque · R9-estoque-exportacao-pronta
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppBar, Badge, Banner, Button, Chip, EmptyState, Text } from '@/components/ui';
import { listStock, stockSummary } from '@/data/repo';
import { ExportSheet, type ExportedFile } from '@/features/common/ExportSheet';
import { SearchBox } from '@/features/common/SearchBox';
import { openScanner } from '@/features/scanner/scanBus';
import { stockWorkbook } from '@/lib/export/reports';
import { saveXlsx, stampName } from '@/lib/export/shareFile';
import { formatMoneyShort } from '@/lib/format';
import { useLoad } from '@/lib/useLoad';
import { colors, radius } from '@/theme/tokens';
import type { StockFilter, StockRow } from '@/types/domain';

const isLow = (r: StockRow) => r.stock_qty > 0 && r.stock_qty <= (r.min_stock ?? 5);

export default function Estoque() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [file, setFile] = useState<ExportedFile>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  useEffect(() => { const id = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(id); }, [q]);

  const summary = useLoad(stockSummary);
  const list = useLoad(() => listStock({ q: debounced, filter }), [debounced, filter]);
  const s = summary.data;

  const exportXlsx = async () => {
    setExportError(null);
    try {
      const [rows, sum] = await Promise.all([listStock({}), stockSummary()]);
      const bytes = stockWorkbook(rows, sum);
      const saved = await saveXlsx(stampName('estoque'), bytes);
      setFile({ ...saved, detail: `${rows.length} produtos` });
    } catch { setExportError('Não foi possível gerar a planilha. Tente de novo.'); }
  };

  const tiles: { label: string; value: string; color?: string }[] = s ? [
    { label: 'Produtos', value: String(s.products) }, { label: 'Unidades', value: s.units.toLocaleString('pt-BR') },
    { label: 'Valor a custo', value: formatMoneyShort(s.cost_value_cents) }, { label: 'Valor de venda', value: formatMoneyShort(s.sale_value_cents) },
    { label: 'Sem estoque', value: String(s.out_of_stock), color: colors.danger }, { label: 'Estoque baixo', value: String(s.low_stock), color: colors.warn },
  ] : [];

  return (
    <View style={styles.root}>
      <AppBar title="Estoque" subtitle="Somente consulta · atualizado agora" back={false} action={{ icon: 'download', label: 'Exportar estoque em Excel', onPress: exportXlsx }} />
      <FlatList
        data={list.data ?? []}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshing={list.loading && !!list.data}
        onRefresh={() => { void summary.reload(); void list.reload(); }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            {exportError ? <Banner tone="danger" title={exportError} /> : null}
            {summary.error ? <Banner tone="danger" title="Não foi possível carregar os totais." /> : null}
            <View style={styles.tiles}>
              {tiles.map((t) => (
                <View key={t.label} style={styles.tile}>
                  <Text variant="caption" color={colors.muted} numberOfLines={1}>{t.label}</Text>
                  <Text variant="section" color={t.color ?? colors.ink} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 18 }}>{t.value}</Text>
                </View>
              ))}
            </View>
            <SearchBox label="Buscar no estoque" value={q} onChangeText={setQ} placeholder="Nome ou código…" onScan={() => { openScanner((c) => setQ(c)); router.push('/scanner'); }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Todos" selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="Baixo" selected={filter === 'low'} onPress={() => setFilter('low')} />
              <Chip label="Zerado" selected={filter === 'out'} onPress={() => setFilter('out')} />
            </View>
          </View>
        }
        ListEmptyComponent={
          list.loading ? <Text variant="body" color={colors.muted} style={styles.center}>Carregando estoque…</Text>
            : list.error ? <View style={{ gap: 12 }}><EmptyState icon="alert" title="Não foi possível carregar" message={list.error} /><Button kind="ghost" label="Tentar de novo" onPress={list.reload} /></View>
              : <EmptyState icon="box" title="Nenhum produto encontrado" message={debounced || filter !== 'all' ? 'Mude a busca ou o filtro.' : 'Cadastre produtos e registre entradas.'} />
        }
        renderItem={({ item }) => {
          const out = item.stock_qty === 0, low = isLow(item);
          return (
            <View style={[styles.row, out && { backgroundColor: colors.dangerSoft }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={2}>{item.name}</Text>
                <Text variant="caption" color={colors.muted}>{item.code}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                {out ? <Badge label="Zerado" tone="out" /> : low ? <Badge label="Baixo" tone="low" /> : null}
                <Text variant="section" color={out ? colors.danger : colors.ink}>{item.stock_qty} un</Text>
              </View>
            </View>
          );
        }}
      />
      <ExportSheet file={file} onClose={() => setFile(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '31.6%', backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 10, gap: 4 },
  row: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  center: { textAlign: 'center', paddingVertical: 32 },
});
