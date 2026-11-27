import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '@/components/ui';
import { colors, radius, type as t } from '@/theme/tokens';

/** Campo de busca com lupa e, opcionalmente, leitor de código de barras. */
export function SearchBox({ value, onChangeText, placeholder, onScan, label, autoFocus }: {
  value: string; onChangeText: (s: string) => void; placeholder: string; onScan?: () => void; label: string; autoFocus?: boolean;
}) {
  return (
    <View style={styles.box}>
      <Icon name="search" color={colors.muted} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted}
        accessibilityLabel={label} autoFocus={autoFocus} autoCorrect={false} style={styles.input} returnKeyType="search" />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => onChangeText('')} style={styles.btn}><Icon name="close" color={colors.muted} /></Pressable>
      ) : null}
      {onScan ? <Pressable accessibilityRole="button" accessibilityLabel="Ler código de barras" onPress={onScan} style={styles.btn}><Icon name="barcode" /></Pressable> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  box: { minHeight: 52, borderRadius: radius.button, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, gap: 10 },
  input: { flex: 1, ...t.input, color: colors.ink, paddingVertical: 12 },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
