import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, sizes, space } from '@/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

/** Sheet inferior com véu 45% (voz, desconto, cliente rápido, exportação). */
export function BottomSheet({ visible, title, subtitle, onClose, children, footer }: {
  visible: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Fechar" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <View style={styles.grip} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text variant="sheetTitle">{title}</Text>
              {subtitle ? <Text variant="label" color={colors.muted}>{subtitle}</Text> : null}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={styles.close}><Icon name="close" /></Pressable>
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: space.xl, paddingTop: space.md },
  grip: { alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: space.md },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  close: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center', marginTop: -8, marginRight: -10 },
  body: { gap: space.md, paddingTop: space.md },
  footer: { flexDirection: 'row', gap: space.md, paddingTop: space.xl },
});
