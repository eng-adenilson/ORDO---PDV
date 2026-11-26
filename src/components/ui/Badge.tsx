import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { Text } from './Text';

export type BadgeTone = 'low' | 'out' | 'ok' | 'neutral' | 'pending';

const tones: Record<BadgeTone, [string, string]> = {
  low: [colors.warnSoft, colors.warn], // estoque baixo
  out: [colors.dangerSoft, colors.danger], // zerado / cancelada
  ok: [colors.okSoft, colors.ok], // desconto
  neutral: [colors.neutralSoft, colors.ink2], // inativo, qtd reconhecida
  pending: [colors.warnSoft, colors.warn], // aguardando envio
};

/** Selo sempre com texto — nunca só cor. */
export function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  const [bg, fg] = tones[tone];
  return <View style={[styles.b, { backgroundColor: bg }]}><Text variant="badge" color={fg}>{label}</Text></View>;
}

const styles = StyleSheet.create({ b: { height: 22, paddingHorizontal: 8, borderRadius: radius.pill, justifyContent: 'center', alignSelf: 'flex-start' } });
