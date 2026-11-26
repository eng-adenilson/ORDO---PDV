import type { ReactElement } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

/** Ícones de traço 2 px em caixa 24 — os mesmos desenhados no Figma. */
export type IconName =
  | 'search' | 'mic' | 'plus' | 'minus' | 'back' | 'chevron' | 'close' | 'cart' | 'box' | 'clock' | 'cash'
  | 'user' | 'more' | 'barcode' | 'trash' | 'download' | 'cloudOff' | 'alert' | 'check' | 'truck' | 'tag'
  | 'lock' | 'pix' | 'card' | 'camera' | 'image';

const shapes: Record<IconName, ReactElement> = {
  search: <><Circle cx={11} cy={11} r={7} /><Path d="M16.5 16.5L21 21" /></>,
  mic: <><Rect x={9} y={3} width={6} height={11} rx={3} /><Path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  back: <Path d="M15 5l-7 7 7 7" />,
  chevron: <Path d="M9 5l7 7-7 7" />,
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  cart: <><Path d="M3 4h2l2.5 11h11L21 7H6.5" /><Circle cx={9} cy={19.5} r={1.5} /><Circle cx={17} cy={19.5} r={1.5} /></>,
  box: <><Path d="M3 8l9-5 9 5v8l-9 5-9-5z" /><Path d="M3 8l9 5 9-5M12 13v8" /></>,
  clock: <><Circle cx={12} cy={12} r={9} /><Path d="M12 7v5l3 2" /></>,
  cash: <><Rect x={2} y={6} width={20} height={12} rx={2} /><Circle cx={12} cy={12} r={2.5} /></>,
  user: <><Circle cx={12} cy={8} r={4} /><Path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></>,
  more: <><Circle cx={5} cy={12} r={1} /><Circle cx={12} cy={12} r={1} /><Circle cx={19} cy={12} r={1} /></>,
  barcode: <Path d="M4 5v14M7 5v14M11 5v14M14 5v14M18 5v14M20 5v14" />,
  trash: <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  download: <Path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  cloudOff: <><Path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z" /><Path d="M4 4l16 16" /></>,
  alert: <><Path d="M12 3l10 18H2z" /><Path d="M12 10v5M12 18v.5" /></>,
  check: <Path d="M5 12l5 5 9-10" />,
  truck: <><Path d="M2 6h12v10H2zM14 10h4l3 3v3h-7" /><Circle cx={6} cy={18} r={2} /><Circle cx={17} cy={18} r={2} /></>,
  tag: <><Path d="M3 12V3h9l9 9-9 9z" /><Circle cx={7.5} cy={7.5} r={1.5} /></>,
  lock: <><Rect x={5} y={11} width={14} height={10} rx={2} /><Path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  pix: <><Path d="M12 3l9 9-9 9-9-9z" /><Path d="M8 12h8" /></>,
  card: <><Rect x={2} y={5} width={20} height={14} rx={2} /><Path d="M2 10h20M6 15h4" /></>,
  camera: <><Rect x={3} y={7} width={18} height={13} rx={2} /><Path d="M8 7l2-3h4l2 3" /><Circle cx={12} cy={13.5} r={3.5} /></>,
  image: <><Rect x={3} y={4} width={18} height={16} rx={2} /><Circle cx={9} cy={10} r={2} /><Path d="M21 17l-5-5-9 8" /></>,
};

export function Icon({ name, size = 24, color = colors.ink }: { name: IconName; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      {shapes[name]}
    </Svg>
  );
}
