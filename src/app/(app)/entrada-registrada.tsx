// Telas: R5-entrada-registrada  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function EntradaRegistrada() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Entrada registrada" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="R5-entrada-registrada"
          todo={[
          "Usar ResultScreen (ver venda-concluida.tsx): saldo antigo → novo, custo, fornecedor",
          ]}
          links={[
          
          ]}
        />
      </Screen>
    </View>
  );
}
