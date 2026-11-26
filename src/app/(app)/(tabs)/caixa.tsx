// Telas: 10a-abrir-caixa · 10-relatorio-diario-caixa  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Caixa() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Caixa de hoje" back={false} />
      <Screen>
        <SpecPlaceholder
          screen="10a-abrir-caixa"
          todo={[
          "Sem caixa aberto → mostrar 10a (valor inicial para troco, atalhos R$50/100/150/200, último fechamento)",
          "Com caixa aberto → card escuro de vendas líquidas, bruto/descontos/cancelado, totais por pagamento, bloco Fechamento",
          "Valores consideram cancelamentos (§10.1) — RPC daily_report",
          ]}
          links={[
          { label: "Relat\u00f3rio completo", href: "/relatorio" },
          { label: "Fechar caixa", href: "/caixa-fechar" }
          ]}
        />
      </Screen>
    </View>
  );
}
