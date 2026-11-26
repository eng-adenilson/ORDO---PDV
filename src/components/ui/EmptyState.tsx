import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message?: string }) {
  return (
    <View style={styles.e}>
      <View style={styles.circle}><Icon name={icon} size={48} color={colors.muted} /></View>
      <Text variant="sheetTitle" style={{ textAlign: 'center' }}>{title}</Text>
      {message ? <Text variant="body" color={colors.muted} style={{ textAlign: 'center' }}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  e: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  circle: { width: 100, height: 100, borderRadius: radius.pill, backgroundColor: colors.placeholder, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
});
