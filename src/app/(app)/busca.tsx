// Telas: 02f-busca-digitando · 02g-busca-sem-resultado
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppBar, Button, Chip, EmptyState, Icon, Text, Thumb } from '@/components/ui';
import { getAvailableQty, searchProducts } from '@/data/repo';
import { useCart } from '@/features/cart/CartContext';
import { VoiceSheet } from '@/features/voice/VoiceSheet';
import { formatMoney } from '@/lib/money';
import { colors, radius, type as t } from '@/theme/tokens';
import type { SaleProduct } from '@/types/domain';

export default function Busca() {
  const { dispatch, summary } = useCart();
  const [text, setText] = useState('');
  const [results, setResults] = useState<SaleProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  // debounce 250 ms (SPEC §5.2)
  useEffect(() => {
    const q = text.trim();
    if (!q) { setResults([]); setLoading(false); setFailed(false); return; }
    setLoading(true);
    let alive = true;
    const id = setTimeout(() => {
      searchProducts(q).then((r) => { if (alive) { setResults(r); setFailed(false); } })
        .catch(() => { if (alive) setFailed(true); })
        .finally(() => { if (alive) setLoading(false); });
    }, 250);
    return () => { alive = false; clearTimeout(id); };
  }, [text]);

  const add = async (p: SaleProduct, qty = 1) => {
    dispatch({ type: 'add', product: p, qty, availableQty: await getAvailableQty(p.id) });
    setAdded(p.name);
  };
  const q = text.trim();
  const first = q.split(/\s+/)[0] ?? '';

  return (
    <View style={styles.root}>
      <AppBar title="Buscar produto" />
      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Icon name="search" />
          <TextInput autoFocus value={text} onChangeText={setText} placeholder="Nome ou código do produto" placeholderTextColor={colors.muted}
            accessibilityLabel="Buscar produto" autoCorrect={false} returnKeyType="search" style={styles.input} />
          {text ? <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setText('')} style={styles.iconBtn}><Icon name="close" color={colors.muted} /></Pressable> : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Buscar por voz" onPress={() => setVoiceOpen(true)} style={styles.mic}><Icon name="mic" /></Pressable>
        </View>
        {q && !loading && !failed ? <Text variant="caption" color={colors.muted} accessibilityLiveRegion="polite">{results.length} {results.length === 1 ? 'resultado' : 'resultados'}</Text> : null}
        {added ? <Text variant="caption" color={colors.ok} accessibilityLiveRegion="polite">Adicionado: {added}</Text> : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: summary.units ? 96 : 16 }}
        ListEmptyComponent={
          !q ? <EmptyState icon="search" title="Busque um produto" message="Digite o nome ou o código, ou use o microfone." />
            : loading ? <Text variant="body" color={colors.muted} style={{ textAlign: 'center', paddingVertical: 32 }}>Buscando…</Text>
              : failed ? <EmptyState icon="alert" title="Não foi possível buscar" message="Tente de novo em instantes." />
                : (
                  <View style={{ gap: 12 }}>
                    <EmptyState icon="search" title={`Nada encontrado para “${q}”`} message="Confira a grafia ou tente um termo mais curto." />
                    {first && first !== q ? <View style={styles.suggest}><Text variant="label" color={colors.muted}>Tente:</Text><Chip label={`Buscar “${first}”`} onPress={() => setText(first)} /></View> : null}
                  </View>
                )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Thumb uri={item.photo_url} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" numberOfLines={2}>{item.name}</Text>
              <Text variant="caption" color={colors.muted}>{item.code} · <Text variant="caption" color={colors.ink}>{formatMoney(item.price_cents ?? 0)}</Text></Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Adicionar ${item.name}`} onPress={() => add(item)} style={styles.add}><Icon name="plus" color="#FFFFFF" /></Pressable>
          </View>
        )}
      />

      {summary.units > 0 ? (
        <View style={styles.cartBar}><Button large label={`Ver carrinho · ${summary.units} un · ${formatMoney(summary.total)}`} onPress={() => router.push('/carrinho')} /></View>
      ) : null}

      <VoiceSheet visible={voiceOpen} onClose={() => setVoiceOpen(false)} onType={() => setVoiceOpen(false)}
        onConfirm={(p, qty) => { setVoiceOpen(false); void add(p, qty); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { backgroundColor: colors.card, paddingHorizontal: 16, paddingBottom: 12, gap: 6, borderBottomWidth: 1, borderBottomColor: colors.line },
  search: { minHeight: 52, borderRadius: radius.button, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 4, gap: 8 },
  input: { flex: 1, ...t.input, color: colors.ink, paddingVertical: 10 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  mic: { width: 44, height: 44, borderRadius: radius.field, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  row: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  add: { width: 44, height: 44, borderRadius: radius.field, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  suggest: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  cartBar: { position: 'absolute', left: 16, right: 16, bottom: 12 },
});
