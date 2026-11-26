import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '@/theme/tokens';

/** Contêiner padrão: fundo bg, margem lateral 16, rodapé fixo opcional (botão principal). */
export function Screen({ children, footer, scroll = true, background = colors.bg }: {
  children: ReactNode; footer?: ReactNode; scroll?: boolean; background?: string;
}) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView edges={['bottom']} style={[styles.root, { backgroundColor: background }]}>
      <Body style={styles.flex} contentContainerStyle={scroll ? styles.content : undefined}>
        {scroll ? children : <View style={[styles.content, styles.flex]}>{children}</View>}
      </Body>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.md },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.lg, paddingTop: space.sm, gap: space.md },
});
