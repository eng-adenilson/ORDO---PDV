import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, sizes } from '@/theme/tokens';
import { Icon } from './Icon';

/** Foto do produto ou placeholder (caixa) quando não há foto — foto é opcional. */
export function Thumb({ uri, size = sizes.thumb }: { uri?: string | null; size?: number }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius.field }} accessibilityIgnoresInvertColors />;
  return <View style={[styles.p, { width: size, height: size }]}><Icon name="box" color={colors.placeholderIcon} /></View>;
}

const styles = StyleSheet.create({ p: { borderRadius: radius.field, backgroundColor: colors.placeholder, alignItems: 'center', justifyContent: 'center' } });
