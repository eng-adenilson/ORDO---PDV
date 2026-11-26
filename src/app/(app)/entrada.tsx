// Telas: 07-entrada-mercadorias · 12-entrada-produto-novo  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Entrada() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Entrada de mercadorias" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="07-entrada-mercadorias"
          todo={[
          "Alternar 'Produto existente' / 'Produto novo'",
          "Existente: localizar por nome/código, Qtd recebida*, Novo saldo (só leitura = saldo + qtd), custo, venda, Fornecedor*",
          "Novo: dados do produto + qtd + fornecedor no mesmo fluxo",
          "Últimas entradas do produto",
          "Registrar → RPC register_stock_entry (soma, nunca substitui) → entrada-registrada",
          ]}
          links={[
          { label: "Resultado", href: "/entrada-registrada" }
          ]}
        />
      </Screen>
    </View>
  );
}
