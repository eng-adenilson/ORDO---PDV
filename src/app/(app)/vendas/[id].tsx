// Telas: 09b-venda-cancelar · 18-venda-cancelada  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Detalhe() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Venda" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="09b-venda-cancelar"
          todo={[
          "Detalhe: vendedor, cliente, pagamento, itens (qtd × preço, desconto), descontos, total",
          "Aviso: venda finalizada não pode ser editada — cancelar e refazer",
          "Cancelar: modal com motivo obrigatório → RPC cancel_sale (devolve estoque)",
          "Cancelada: faixa 'CANCELADA às … por …' + motivo, valores em cinza, 'Refazer venda com estes itens' (preenche o carrinho)",
          ]}
          links={[
          
          ]}
        />
      </Screen>
    </View>
  );
}
