// Telas: 16-scanner  (docs/figma/png/)
// FUNDAÇÃO: rota pronta e navegável. Implemente conforme SPEC.md, usando os componentes de @/components/ui
// e o padrão de src/app/(app)/(tabs)/index.tsx (Vender) e carrinho.tsx.
import { View } from 'react-native';
import { AppBar, Screen, SpecPlaceholder } from '@/components/ui';

export default function Scanner() {
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Ler código de barras" back={true} />
      <Screen>
        <SpecPlaceholder
          screen="16-scanner"
          todo={[
          "expo-camera CameraView com barcodeScannerSettings (ean13, ean8, code128, upc_a)",
          "Moldura branca + linha amarela; leitura automática, vibração curta",
          "Devolve o código para a tela que abriu (router.back + params ou store)",
          "Botão 'Digitar código'",
          ]}
          links={[
          
          ]}
        />
      </Screen>
    </View>
  );
}
