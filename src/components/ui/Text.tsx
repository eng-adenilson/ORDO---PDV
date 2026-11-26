import { Text as RNText, type TextProps } from 'react-native';
import { colors, type as t } from '@/theme/tokens';

type Variant = keyof typeof t;

export function Text({ variant = 'body', color = colors.ink, style, ...rest }: TextProps & { variant?: Variant; color?: string }) {
  return <RNText {...rest} style={[t[variant], { color }, style]} />;
}
