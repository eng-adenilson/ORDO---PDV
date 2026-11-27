// Tela: 05-clientes
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppBar, Button, Card, EmptyState, Icon, Text } from '@/components/ui';
import { searchCustomers } from '@/data/repo';
import { Avatar } from '@/features/common/Avatar';
import { SearchBox } from '@/features/common/SearchBox';
import { useLoad } from '@/lib/useLoad';
import { plural } from '@/lib/format';
import { colors } from '@/theme/tokens';

export default function Clientes() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => { const id = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(id); }, [q]);
  const { data, loading, error, reload } = useLoad(() => searchCustomers(debounced), [debounced]);

  return (
    <View style={styles.root}>
      <AppBar title="Clientes" action={{ icon: 'plus', label: 'Novo cliente', onPress: () => router.push('/clientes/novo') }} />
      <View style={styles.search}><SearchBox label="Buscar cliente" value={q} onChangeText={setQ} placeholder="Nome ou telefone" /></View>
      <FlatList
        data={data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshing={loading && !!data}
        onRefresh={reload}
        ListEmptyComponent={
          loading ? <Text variant="body" color={colors.muted} style={styles.center}>Carregando clientes…</Text>
            : error ? <View style={{ gap: 12 }}><EmptyState icon="alert" title="Não foi possível carregar" message={error} /><Button kind="ghost" label="Tentar de novo" onPress={reload} /></View>
              : debounced ? <EmptyState icon="user" title={`Nenhum cliente para “${debounced}”`} message="Confira o nome ou o telefone, ou cadastre um novo cliente." />
                : <View style={{ gap: 12 }}><EmptyState icon="user" title="Nenhum cliente ainda" message="Cadastre clientes para vincular às vendas. É opcional." /><Button label="Novo cliente" icon="plus" onPress={() => router.push('/clientes/novo')} /></View>
        }
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Avatar name={item.name} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={1}>{item.name}</Text>
              <Text variant="caption" color={colors.muted}>{item.phone} · {plural(item.purchases, 'compra', 'compras')}</Text>
            </View>
            <Icon name="chevron" color={colors.muted} />
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  search: { padding: 16, paddingBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  center: { textAlign: 'center', paddingVertical: 32 },
});
