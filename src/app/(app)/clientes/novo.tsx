// Telas: 04-cadastro-rapido-cliente  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Novo() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Novo cliente" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="04-cadastro-rapido-cliente"
          todo={[
          "Mesmos campos do sheet rápido: Nome*, Telefone* (máscara)",
          "Salvar → createCustomer; volta com toast",
          ]}
          links={[
          
          ]}
        />
      </Screen>
    </View>
  );
}
