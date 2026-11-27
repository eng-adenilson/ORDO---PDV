// Telas: 06-cadastro-produto · R7-produto-codigo-duplicado
import { router } from 'expo-router';
import { View } from 'react-native';
import { AppBar } from '@/components/ui';
import { ProductForm } from '@/features/products/ProductForm';
import { notifyProductSaved } from '@/features/products/savedBus';

export default function NovoProduto() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Novo produto" />
      <ProductForm onSaved={(p) => { notifyProductSaved(p); router.back(); }} />
    </View>
  );
}
