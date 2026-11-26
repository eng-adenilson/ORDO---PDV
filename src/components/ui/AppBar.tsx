import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, sizes } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Props = { title: string; subtitle?: string; back?: boolean; action?: { icon: IconName; label: string; onPress: () => void } };

/** Barra superior das telas (fundo branco, divisor inferior). Use em Stack com headerShown:false. */
export function AppBar({ title, subtitle, back = true, action }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.btn}>
          <Icon name="back" />
        </Pressable>
      ) : <View style={{ width: 4 }} />}
      <View style={styles.titles}>
        <Text variant="screenTitle" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="caption" color={colors.muted} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action.label} onPress={action.onPress} style={styles.btn}>
          <Icon name={action.icon} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8, minHeight: sizes.appBar },
  btn: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1, paddingHorizontal: 4 },
});
