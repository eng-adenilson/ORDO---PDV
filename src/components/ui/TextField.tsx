import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, sizes, type as t } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Props = TextInputProps & {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: IconName;
  /** Ação à direita (ex.: barcode abre o scanner). */
  trailingIcon?: IconName;
  onTrailingPress?: () => void;
  readOnlyValue?: boolean;
};

/** Campo com rótulo visível acima (nunca só placeholder). Erro aparece embaixo e diz o que fazer. */
export function TextField({ label, required, error, hint, icon, trailingIcon, onTrailingPress, readOnlyValue, style, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.ink : colors.line;
  return (
    <View style={styles.wrap}>
      <Text variant="label" color={error ? colors.danger : colors.ink2}>{label}{required ? ' *' : ''}</Text>
      <View style={[styles.box, { borderColor, borderWidth: error || focused ? 2 : 1 },
        readOnlyValue && { backgroundColor: colors.neutralSoft, borderWidth: 0 }]}>
        {icon ? <Icon name={icon} color={colors.muted} /> : null}
        <TextInput
          editable={!readOnlyValue}
          placeholderTextColor={colors.muted}
          onFocus={(e) => { setFocused(true); input.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); input.onBlur?.(e); }}
          style={[styles.input, style]}
          accessibilityLabel={label}
          {...input}
        />
        {trailingIcon ? (
          <Pressable accessibilityRole="button" onPress={onTrailingPress} hitSlop={8} style={styles.trailing}>
            <Icon name={trailingIcon} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text variant="caption" color={colors.danger}>{error}</Text>
        : hint ? <Text variant="caption" color={colors.muted}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  box: { minHeight: sizes.field, borderRadius: radius.field, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, ...t.input, color: colors.ink, paddingVertical: 12 },
  trailing: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
});
