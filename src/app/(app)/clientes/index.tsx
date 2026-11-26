// Telas: 05-clientes  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Clientes() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Clientes" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="05-clientes"
          todo={[
          "Busca por nome ou telefone",
          "Lista com avatar (inicial), nome, telefone · nº de compras",
          "+ na app bar abre clientes/novo",
          ]}
          links={[
          { label: "Novo cliente", href: "/clientes/novo" }
          ]}
        />
      </Screen>
    </View>
  );
}
