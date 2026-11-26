// Telas: 11-mais  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Button, Screen, SpecPlaceholder } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';

export default function Mais() {
  const { signOut } = useAuth();
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Mais" back={false} />
      <Screen>
        <SpecPlaceholder
          screen="11-mais"
          todo={[
          "Cartão do usuário com 'Sair' (useAuth().signOut)",
          "Itens: Clientes, Produtos, Entrada de mercadorias, Sincronização (com contagem pendente)",
          ]}
          links={[
          { label: "Clientes", href: "/clientes" },
          { label: "Produtos", href: "/produtos" },
          { label: "Entrada de mercadorias", href: "/entrada" },
          { label: "Sincroniza\u00e7\u00e3o", href: "/sincronizacao" }
          ]}
        />
        <Button kind="ghost" label="Sair" onPress={signOut} />
      </Screen>
    </View>
  );
}
