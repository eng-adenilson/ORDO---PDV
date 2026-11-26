import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, sizes } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type ButtonKind = 'primary' | 'brand' | 'ghost' | 'danger';

const palette: Record<ButtonKind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.ink, fg: '#FFFFFF' },
  brand: { bg: colors.brand, fg: colors.ink },
  ghost: { bg: colors.card, fg: colors.ink, border: colors.line },
  danger: { bg: colors.danger, fg: '#FFFFFF' },
};

type Props = {
  label: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  large?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Mostrado perto do botão quando desabilitado: diga por quê (ex.: estoque insuficiente). */
  accessibilityHint?: string;
};

export function Button({ label, onPress, kind = 'primary', icon, large, disabled, loading, accessibilityHint }: Props) {
  const p = disabled ? { bg: colors.disabledBg, fg: colors.disabledFg } : palette[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height: large ? sizes.buttonLarge : sizes.button, backgroundColor: p.bg, opacity: pressed ? 0.85 : 1 },
        'border' in p && p.border ? { borderWidth: 1, borderColor: p.border } : null,
      ]}>
      {loading ? <ActivityIndicator color={p.fg} /> : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} color={p.fg} /> : null}
          <Text variant="button" color={p.fg}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
