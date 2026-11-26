import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, sizes } from '@/theme/tokens';
import { Text } from './Text';

/** Filtro/seleção em pílula. Altura visual 36, área de toque ≥ 44 via hitSlop. */
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress} hitSlop={4}
      style={[styles.chip, selected ? styles.on : styles.off]}>
      <Text variant="label" color={selected ? '#FFFFFF' : colors.ink}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { height: sizes.chip, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.ink },
  off: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
});
