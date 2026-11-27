import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { colors } from '@/theme/tokens';
import { initial } from '@/lib/format';

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View style={[styles.a, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text variant="section">{initial(name)}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ a: { backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' } });
