// Telas: 06-cadastro-produto · R7-produto-codigo-duplicado  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Novo() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Novo produto" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="06-cadastro-produto"
          todo={[
          "Foto opcional (expo-image-picker) → Supabase Storage bucket product-photos",
          "Nome* e Código* (único; leitor de código de barras)",
          "Categoria (lista expansível), Status ativo/inativo, Preço de custo, Preço de venda, Descrição",
          "Código duplicado: erro no rótulo do campo + botão desabilitado (erro 23505 do banco)",
          "Estoque inicial NÃO é editado aqui — vai pela Entrada de mercadorias",
          ]}
          links={[
          { label: "Scanner", href: "/scanner" }
          ]}
        />
      </Screen>
    </View>
  );
}
