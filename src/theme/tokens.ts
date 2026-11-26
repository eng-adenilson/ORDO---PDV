/**
 * Tokens do design system ORDO — fonte única de cores, tipografia e espaçamento.
 * Espelham exatamente o Figma ("Telas — ORDO v1"). Não use cores soltas nas telas.
 * Referência visual: docs/figma/png/*.png · Especificação: SPEC.md §4.
 */
export const colors = {
  ink: '#1A1A1A', // texto principal, botão primário, chip ativo
  ink2: '#3A3A3A', // rótulos de campo
  muted: '#5F5F5F', // texto secundário (contraste ≥ 4.5:1 sobre branco)
  line: '#E4E2DA', // bordas e divisores
  bg: '#F7F6F2', // fundo das telas
  card: '#FFFFFF', // cartões, campos, app bar, tab bar
  placeholder: '#ECEAE3', // fundo de foto ausente / ícone vazio
  placeholderIcon: '#9C9A92',
  disabledBg: '#D9D7CF',
  disabledFg: '#5F5D56',
  neutralSoft: '#EEEDE8', // campo somente leitura, selo neutro
  brand: '#F2B705', // ação de destaque (microfone, Confirmar venda, Abrir caixa). Texto sobre ele: ink
  brandSoft: '#FFF4CC', // aba ativa, seleção, avatar
  ok: '#1E7F4F',
  okSoft: '#E3F3EA',
  danger: '#C62828',
  dangerSoft: '#FDE8E8',
  warn: '#8A4B00',
  warnSoft: '#FDECC8',
  scrim: 'rgba(0,0,0,0.45)',
  scannerBg: '#111111',
  scannerSurface: '#2A2A2A',
} as const;

export const radius = { sm: 8, field: 10, button: 12, card: 14, tile: 16, sheet: 24, pill: 999 } as const;

/** Escala de 4 px. Margem lateral das telas = 16. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

/** Alturas mínimas — alvo de toque ≥ 44 px (Web Interface Guidelines). */
export const sizes = {
  touch: 44,
  field: 48,
  button: 52,
  buttonLarge: 56,
  chip: 36,
  appBar: 64, // abaixo da status bar
  tabBar: 72,
  thumb: 48,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Estilos de texto (tamanho em px, como no Figma). */
export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 36 }, // total a receber
  title: { fontFamily: fonts.extrabold, fontSize: 22 }, // título de tela de resultado
  screenTitle: { fontFamily: fonts.bold, fontSize: 20 },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 18 },
  section: { fontFamily: fonts.bold, fontSize: 15 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 14 },
  body: { fontFamily: fonts.regular, fontSize: 14 },
  input: { fontFamily: fonts.regular, fontSize: 15 },
  button: { fontFamily: fonts.semibold, fontSize: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
  caption: { fontFamily: fonts.medium, fontSize: 12 },
  badge: { fontFamily: fonts.bold, fontSize: 11 },
  tab: { fontFamily: fonts.medium, fontSize: 12 },
  money: { fontFamily: fonts.bold, fontSize: 15, fontVariant: ['tabular-nums'] as const },
} as const;
