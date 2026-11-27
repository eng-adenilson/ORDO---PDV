// Telas: 13-produtos · R8-produtos-produto-salvo
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, Badge, Button, Chip, EmptyState, Text, Thumb, Toast } from '@/components/ui';
import { listCategories, listProducts } from '@/data/repo';
import { SearchBox } from '@/features/common/SearchBox';
import { takeSavedProduct } from '@/features/products/savedBus';
import { openScanner } from '@/features/scanner/scanBus';
import { formatMoney } from '@/lib/money';
import { useLoad } from '@/lib/useLoad';
import { colors, radius } from '@/theme/tokens';
import type { Product } from '@/types/domain';

export default function Produtos() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<string>('active');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [saved, setSaved] = useState<Product | null>(null);
  useEffect(() => { const id = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(id); }, [q]);
  useEffect(() => { listCategories().then(setCategories).catch(() => {}); }, []);
  useFocusEffect(useCallback(() => { const p = takeSavedProduct(); if (p) setSaved(p); }, []));
  const { data, loading, error, reload } = useLoad(() => listProducts({ q: debounced, filter }), [debounced, filter]);
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? 'Sem categoria';

  return (
    <View style={styles.root}>
      <AppBar title="Produtos" subtitle={data ? `${data.length} ${data.length === 1 ? 'produto' : 'produtos'}` : undefined}
        action={{ icon: 'plus', label: 'Novo produto', onPress: () => router.push('/produtos/novo') }} />
      <View style={styles.head}>
        <SearchBox label="Buscar produto" value={q} onChangeText={setQ} placeholder="Nome ou código…" onScan={() => { openScanner((c) => setQ(c)); router.push('/scanner'); }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="Ativos" selected={filter === 'active'} onPress={() => setFilter('active')} />
          <Chip label="Inativos" selected={filter === 'inactive'} onPress={() => setFilter('inactive')} />
          {categories.map((c) => <Chip key={c.id} label={c.name} selected={filter === c.id} onPress={() => setFilter(c.id)} />)}
        </ScrollView>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 80 }}
        refreshing={loading && !!data}
        onRefresh={reload}
        ListEmptyComponent={
          loading ? <Text variant="body" color={colors.muted} style={styles.center}>Carregando produtos…</Text>
            : error ? <View style={{ gap: 12 }}><EmptyState icon="alert" title="Não foi possível carregar" message={error} /><Button kind="ghost" label="Tentar de novo" onPress={reload} /></View>
              : <View style={{ gap: 12 }}>
                <EmptyState icon="box" title={debounced ? `Nenhum produto para “${debounced}”` : 'Nenhum produto aqui'} message={debounced ? 'Confira a grafia ou o código.' : 'Cadastre o primeiro produto.'} />
                {!debounced && filter === 'active' ? <Button label="Novo produto" icon="plus" onPress={() => router.push('/produtos/novo')} /> : null}
              </View>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${item.name}`} onPress={() => router.push({ pathname: '/produtos/[id]', params: { id: item.id } })} style={styles.row}>
            <Thumb uri={item.photo_url} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" color={item.active ? colors.ink : colors.muted} numberOfLines={2}>{item.name}</Text>
              <Text variant="caption" color={colors.muted}>{item.code} · {catName(item.category_id)}</Text>
              {!item.active ? <Badge label="Inativo" tone="neutral" /> : null}
            </View>
            <Text variant="money" color={item.active ? colors.ink : colors.muted}>{item.price_cents === null ? '—' : formatMoney(item.price_cents)}</Text>
          </Pressable>
        )}
      />
      <Toast visible={!!saved} message={saved ? `Produto salvo · ${saved.name}` : ''} onHide={() => setSaved(null)} />
      {saved ? <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${saved.name}`} style={styles.toastAction}
        onPress={() => { const id = saved.id; setSaved(null); router.push({ pathname: '/produtos/[id]', params: { id } }); }}><Text variant="label" color={colors.brand}>Ver</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { padding: 16, gap: 12, paddingBottom: 0 },
  row: { minHeight: 72, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  center: { textAlign: 'center', paddingVertical: 32 },
  toastAction: { position: 'absolute', right: 28, bottom: 16, height: 52, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
});
