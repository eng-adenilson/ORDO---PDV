// Telas: 09-historico-vendas  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Historico() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Histórico de vendas" subtitle="Hoje" back={false} />
      <Screen>
        <SpecPlaceholder
          screen="09-historico-vendas"
          todo={[
          "Filtros Hoje/Ontem/7 dias/Canceladas",
          "Cartão: Venda #n, hora · vendedor · pagamento, valor à direita",
          "Cancelada: valor riscado + selo 'Cancelada'; pendente de envio: selo 'Aguardando envio'",
          "Toque abre o detalhe",
          ]}
          links={[
          { label: "Venda #1048", href: "/vendas/1048" }
          ]}
        />
      </Screen>
    </View>
  );
}
