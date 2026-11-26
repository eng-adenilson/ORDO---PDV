// Telas: 02-vendas (+ sheets de voz 02b–02e). Implementação de referência — siga este padrão nas demais telas.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Chip, Icon, Logo, Text } from '@/components/ui';
import { getAvailableQty, listCategories, listSaleProducts } from '@/data/repo';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { ProductCard } from '@/features/sales/ProductCard';
import { VoiceSheet } from '@/features/voice/VoiceSheet';
import { useIsOffline } from '@/lib/connectivity';
import { formatMoney } from '@/lib/money';
import { usePendingCount } from '@/lib/offline/usePendingCount';
import { colors, radius, space } from '@/theme/tokens';
import type { SaleProduct } from '@/types/domain';

export default function Vender() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { dispatch, summary } = useCart();
  const offline = useIsOffline();
  const pending = usePendingCount();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [voiceOpen, setVoiceOpen] = useState(false);

  useEffect(() => { listCategories().then(setCategories).catch(() => {}); }, []);
  useEffect(() => { listSaleProducts(category).then(setProducts).catch(() => {}); }, [category]);

  const add = async (p: SaleProduct, qty = 1) => {
    dispatch({ type: 'add', product: p, qty, availableQty: await getAvailableQty(p.id) });
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.titleRow}>
          <Logo size={28} />
          <Text variant="screenTitle" style={{ flex: 1 }}>Vender</Text>
          <Text variant="label" color={colors.muted}>{user?.name}</Text>
        </View>
        <View style={styles.search}>
          <Pressable accessibilityRole="search" onPress={() => router.push('/busca')} style={styles.searchField}>
            <Icon name="search" color={colors.muted} />
            <Text variant="input" color={colors.muted}>Buscar produto pelo nome…</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Buscar por voz" onPress={() => setVoiceOpen(true)} style={styles.mic}>
            <Icon name="mic" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={{ padding: space.lg, gap: 8, paddingBottom: summary.units ? 96 : space.lg }}
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: 4 }}>
            {offline || pending > 0 ? <Banner tone="warn" title={`${offline ? 'Sem internet · ' : ''}${pending} vendas aguardando envio`} /> : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label="Todos" selected={!category} onPress={() => setCategory(null)} />
              {categories.map((c) => <Chip key={c.id} label={c.name} selected={category === c.id} onPress={() => setCategory(c.id)} />)}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} onAdd={() => add(item)} />}
      />

      {summary.units > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/carrinho')} style={styles.cartBar}>
          <View style={styles.count}><Text variant="label">{summary.units}</Text></View>
          <Text variant="bodyStrong" color="#FFFFFF" style={{ flex: 1 }}>Ver carrinho</Text>
          <Text variant="money" color="#FFFFFF">{formatMoney(summary.total)}</Text>
        </Pressable>
      ) : null}

      <VoiceSheet visible={voiceOpen} onClose={() => setVoiceOpen(false)}
        onType={() => { setVoiceOpen(false); router.push('/busca'); }}
        onConfirm={(p, qty) => { setVoiceOpen(false); void add(p, qty); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.card, paddingHorizontal: space.xl, paddingBottom: space.lg, gap: space.lg, borderBottomWidth: 1, borderBottomColor: colors.line },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.button, borderWidth: 1, borderColor: colors.line, padding: 4, paddingLeft: 12, gap: 8 },
  searchField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  mic: { width: 48, height: 48, borderRadius: radius.field, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  cartBar: { position: 'absolute', left: 16, right: 16, bottom: 8, height: 56, borderRadius: radius.card, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  count: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
});
