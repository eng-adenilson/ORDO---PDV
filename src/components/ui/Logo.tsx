import Svg, { G, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

/**
 * Logo ORDO "Grade": grade 3×3 com o centro vazio (um "O") e o quadrado do canto
 * superior direito amarelo, girado 15° — o produto saindo da prateleira.
 * Geometria idêntica a docs/brand/ordo-symbol.svg (viewBox 256).
 */
const CELLS: [number, number][] = [[32, 32], [100, 32], [32, 100], [168, 100], [32, 168], [100, 168], [168, 168]];

export function Logo({ size = 32, inverted = false }: { size?: number; inverted?: boolean }) {
  const ink = inverted ? '#FFFFFF' : colors.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" accessibilityLabel="ORDO">
      <G fill={ink}>
        {CELLS.map(([x, y]) => <Rect key={`${x}-${y}`} x={x} y={y} width={56} height={56} rx={8} />)}
      </G>
      <Rect x={172} y={26} width={48} height={48} rx={7} fill={colors.brand} transform="rotate(15 196 50)" />
    </Svg>
  );
}
