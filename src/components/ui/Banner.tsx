import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

const tones = {
  warn: { bg: colors.warnSoft, fg: colors.warn, icon: 'cloudOff' as IconName },
  danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert' as IconName },
  ok: { bg: colors.okSoft, fg: colors.ok, icon: 'check' as IconName },
};

/** Aviso em faixa: offline (warn), estoque insuficiente / erro (danger). Texto diz o que fazer. */
export function Banner({ tone, title, message, icon }: { tone: keyof typeof tones; title: string; message?: string; icon?: IconName }) {
  const t = tones[tone];
  return (
    <View accessibilityRole="alert" style={[styles.b, { backgroundColor: t.bg }, tone === 'danger' && { borderWidth: 1, borderColor: colors.danger }]}>
      <Icon name={icon ?? t.icon} color={t.fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" color={t.fg}>{title}</Text>
        {message ? <Text variant="caption" color={t.fg}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ b: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: radius.button } });
