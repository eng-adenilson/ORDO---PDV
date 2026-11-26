import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

/** Confirmação curta (produto salvo, venda cancelada). Some sozinha após `duration` ms. */
export function Toast({ message, visible, onHide, duration = 3500 }: { message: string; visible: boolean; onHide: () => void; duration?: number }) {
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(onHide, duration);
    return () => clearTimeout(id);
  }, [visible, duration, onHide]);
  if (!visible) return null;
  return (
    <View accessibilityLiveRegion="polite" style={styles.t}>
      <View style={styles.dot}><Icon name="check" size={18} /></View>
      <Text variant="label" color="#FFFFFF" style={{ flex: 1 }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  t: { position: 'absolute', left: 16, right: 16, bottom: 16, minHeight: 52, borderRadius: radius.card, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
});
