// Telas: R6-caixa-fechado  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function CaixaFechado() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Caixa fechado" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="R6-caixa-fechado"
          todo={[
          "ResultScreen tom brand, ícone lock: líquido, esperado, contado, diferença; Exportar relatório Excel; Concluir",
          ]}
          links={[
          
          ]}
        />
      </Screen>
    </View>
  );
}
