// Telas: 17-sincronizacao  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Sincronizacao() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Sincronização" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="17-sincronizacao"
          todo={[
          "Faixa: N vendas guardadas neste celular",
          "Aguardando envio (outbox status pending/failed)",
          "Precisa de atenção (status rejected): motivo + 'Ver venda' / 'Tentar de novo'",
          "Enviado hoje: contagem",
          "'Tentar enviar agora' → syncOutbox()",
          ]}
          links={[
          
          ]}
        />
      </Screen>
    </View>
  );
}
