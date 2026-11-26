import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, sizes } from '@/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

/** Quantidade inteira (estoque não é fracionado). `max` = saldo disponível; acima disso fica em erro. */
export function Stepper({ value, onChange, min = 1, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const over = max !== undefined && value > max;
  return (
    <View style={[styles.s, over && { borderColor: colors.danger, borderWidth: 1.5 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Diminuir" disabled={value <= min} onPress={() => onChange(value - 1)} style={styles.b}>
        <Icon name="minus" color={value <= min ? colors.line : colors.ink} />
      </Pressable>
      <Text variant="section" color={over ? colors.danger : colors.ink} style={styles.v} accessibilityLiveRegion="polite">{value}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Aumentar" onPress={() => onChange(value + 1)} style={styles.b}>
        <Icon name="plus" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  s: { height: sizes.touch, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center' },
  b: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  v: { minWidth: 32, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
