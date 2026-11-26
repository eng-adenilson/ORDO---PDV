// Telas: 08-consulta-estoque · R9-estoque-exportacao-pronta  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Estoque() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Estoque" subtitle="Somente consulta" back={false} />
      <Screen>
        <SpecPlaceholder
          screen="08-consulta-estoque"
          todo={[
          "6 totalizadores (produtos, unidades, valor a custo, valor de venda, sem estoque, estoque baixo) — RPC stock_summary",
          "Busca por nome/código + leitor de código de barras; filtros Todos/Baixo/Zerado",
          "Linha zerada com fundo dangerSoft e selo 'Zerado'; baixo com selo 'Baixo' (critério: min_stock)",
          "Sem nenhuma ação de alterar saldo (regra §12)",
          "Exportar .xlsx (lib/export) → sheet 'Exportação pronta' com expo-sharing",
          ]}
          links={[
          { label: "Scanner", href: "/scanner" }
          ]}
        />
      </Screen>
    </View>
  );
}
