import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

/** Telas de fluxo empilhadas sobre as abas. Cada tela desenha sua própria AppBar. */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="venda-concluida" options={{ gestureEnabled: false }} />
      <Stack.Screen name="entrada-registrada" options={{ gestureEnabled: false }} />
      <Stack.Screen name="caixa-fechado" options={{ gestureEnabled: false }} />
      <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: colors.scannerBg } }} />
    </Stack>
  );
}
