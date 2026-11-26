import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius } from '@/theme/tokens';

export function Card({ style, onPress, tone, ...rest }: ViewProps & { onPress?: () => void; tone?: 'danger' | 'selected' }) {
  const toneStyle = tone === 'danger' ? { borderColor: colors.danger, borderWidth: 1.5 }
    : tone === 'selected' ? { borderColor: colors.ink, borderWidth: 2 } : null;
  if (onPress) return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.c, toneStyle, style]} {...rest} />;
  return <View style={[styles.c, toneStyle, style]} {...rest} />;
}

const styles = StyleSheet.create({ c: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 12 } });
