// Telas: 06-cadastro-produto  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Detalhe() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Editar produto" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="06-cadastro-produto"
          todo={[
          "Mesmo formulário de produtos/novo preenchido; saldo mostrado só leitura",
          ]}
          links={[
          
          ]}
        />
      </Screen>
    </View>
  );
}
