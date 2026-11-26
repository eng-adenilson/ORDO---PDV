import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, space } from '@/theme/tokens';
import { Banner } from './Banner';
import { Button } from './Button';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

const tones = { ok: [colors.okSoft, colors.ok], warn: [colors.warnSoft, colors.warn], danger: [colors.dangerSoft, colors.danger], brand: [colors.brandSoft, colors.ink] } as const;

/** Tela de resultado de fluxo (R3–R6): ícone grande, título, resumo e duas ações. */
export function ResultScreen({ tone = 'ok', icon = 'check', title, lines, rows, note, primary, secondary }: {
  tone?: keyof typeof tones; icon?: IconName; title: string; lines: string[];
  rows: { label: string; value: string; color?: string }[]; note?: string;
  primary: { label: string; onPress: () => void }; secondary?: { label: string; onPress: () => void };
}) {
  const [bg, fg] = tones[tone];
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.top}>
        <View style={[styles.circle, { backgroundColor: bg }]}><Icon name={icon} size={64} color={fg} /></View>
        <Text variant="title" style={styles.center}>{title}</Text>
        {lines.map((l) => <Text key={l} variant="body" color={colors.muted} style={styles.center}>{l}</Text>)}
      </View>
      <Card style={{ gap: 14 }}>
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text variant="label" color={colors.muted}>{r.label}</Text>
            <Text variant="label" color={r.color ?? colors.ink} style={{ fontVariant: ['tabular-nums'] }}>{r.value}</Text>
          </View>
        ))}
      </Card>
      {note ? <Banner tone="warn" title={note} /> : null}
      <View style={{ flex: 1 }} />
      {secondary ? <Button kind="ghost" label={secondary.label} onPress={secondary.onPress} /> : null}
      <Button large label={primary.label} onPress={primary.onPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: space.lg, gap: space.md },
  top: { alignItems: 'center', gap: 6, marginTop: 64, marginBottom: 16 },
  circle: { width: 112, height: 112, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
