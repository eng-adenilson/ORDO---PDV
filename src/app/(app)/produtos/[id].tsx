// Tela: 06-cadastro-produto (editar)
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AppBar, Button, EmptyState, Screen, Text } from '@/components/ui';
import { getProduct } from '@/data/repo';
import { ProductForm } from '@/features/products/ProductForm';
import { notifyProductSaved } from '@/features/products/savedBus';
import { useLoad } from '@/lib/useLoad';
import { colors } from '@/theme/tokens';

export default function EditarProduto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useLoad(() => getProduct(String(id)), [id]);

  if (!data) {
    return (
      <View style={{ flex: 1 }}>
        <AppBar title="Editar produto" />
        <Screen>
          {loading ? <Text variant="body" color={colors.muted} style={{ textAlign: 'center', paddingVertical: 32 }}>Carregando produto…</Text>
            : <><EmptyState icon="alert" title={error ? 'Não foi possível carregar' : 'Produto não encontrado'} message={error ?? 'Ele pode ter sido removido.'} /><Button kind="ghost" label="Tentar de novo" onPress={reload} /></>}
        </Screen>
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Editar produto" subtitle={data.code} />
      <ProductForm key={data.id} product={data} onSaved={(p) => { notifyProductSaved(p); router.back(); }} />
    </View>
  );
}
