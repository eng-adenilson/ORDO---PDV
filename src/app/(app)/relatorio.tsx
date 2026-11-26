// Telas: 14-relatorio-do-dia  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Relatorio() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Relatório do dia" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="14-relatorio-do-dia"
          todo={[
          "Produtos vendidos e quantidades (top 4 + 'ver todos')",
          "Cancelamentos com motivo e valor",
          "Por vendedor: nº de vendas e total",
          "Exportar Excel",
          ]}
          links={[
          
          ]}
        />
      </Screen>
    </View>
  );
}
