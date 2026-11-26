// Telas: 13-produtos · R8-produtos-produto-salvo  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Produtos() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Produtos" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="13-produtos"
          todo={[
          "Busca + leitor; filtros Ativos/Inativos/categorias",
          "Linha: foto, nome, código · categoria, preço; selo 'Inativo'",
          "Toque → produtos/[id]; + → produtos/novo; toast 'Produto salvo'",
          ]}
          links={[
          { label: "Novo produto", href: "/produtos/novo" },
          { label: "Editar Metalon", href: "/produtos/p1" }
          ]}
        />
      </Screen>
    </View>
  );
}
