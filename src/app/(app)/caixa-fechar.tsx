// Telas: 15-fechar-caixa  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function CaixaFechar() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Fechar caixa" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="15-fechar-caixa"
          todo={[
          "Troco inicial + vendas em dinheiro = esperado",
          "Campo 'Quanto você contou na gaveta?'* (dinheiro)",
          "Diferença calculada ao digitar: falta (danger) / sobra (warn) / ok",
          "Observação opcional; 'Contar de novo' e 'Confirmar fechamento' → RPC close_cash_session",
          ]}
          links={[
          { label: "Resultado", href: "/caixa-fechado" }
          ]}
        />
      </Screen>
    </View>
  );
}
