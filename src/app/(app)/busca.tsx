// Telas: 02f-busca-digitando · 02g-busca-sem-resultado  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Busca() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Buscar produto" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="02f-busca-digitando"
          todo={[
          "Campo com foco automático; resultados conforme digita (debounce 250 ms) via searchProducts",
          "Linha: foto, nome, código · preço, botão + (44 px). SEM estoque e SEM custo (§2.2)",
          "Sem resultado: estado vazio com sugestão de termo mais curto",
          "Botão de microfone abre a mesma VoiceSheet da tela Vender",
          ]}
          links={[
          { label: "Carrinho", href: "/carrinho" }
          ]}
        />
      </Screen>
    </View>
  );
}
