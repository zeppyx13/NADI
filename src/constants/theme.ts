/**
 * NADI Design System — Centralized Design Tokens
 *
 * Sumber kebenaran: docs/design.md
 * Jangan menduplikasi nilai token di komponen individual.
 * Gunakan token dari file ini untuk semua warna, spacing, radius, typography, shadow, dll.
 */

import { Platform, type TextStyle } from 'react-native';

// ---------------------------------------------------------------------------
// 2. Colors
// ---------------------------------------------------------------------------

export const colors = {
  brand: {
    50: '#EDF8FF',
    100: '#D9F0FF',
    200: '#B7E0F8',
    300: '#7BC8EF',
    400: '#4E9CE2',
    500: '#388AD9',
    600: '#2E70BA',
    700: '#235694',
    800: '#173E70',
    900: '#102C4F',
  },
  teal: {
    50: '#EAFBF9',
    100: '#D2F5F1',
    300: '#7ADBD2',
    500: '#47B1AD',
    600: '#159E98',
    700: '#0E7F7A',
  },
  neutral: {
    white: '#FFFFFF',
    surfaceSoft: '#F2F8FC',
    surfaceMuted: '#ECF3F7',
    borderSoft: '#E0E7EE',
    borderStrong: '#CED5DA',
    textPrimary: '#18364A',
    textSecondary: '#5F7382',
    textMuted: '#8C9EA9',
    iconMuted: '#7D909D',
    navy: '#1C3852',
    black: '#111820',
  },
  semantic: {
    success: { bg: '#EAF8F1', main: '#20A66A', text: '#147247' },
    info: { bg: '#EAF5FE', main: '#2F8ED8', text: '#1F659E' },
    warning: { bg: '#FFF7E5', main: '#E9B85A', text: '#8E6414' },
    danger: { bg: '#FFF0EF', main: '#E4514C', text: '#A22C1F' },
    disabled: { bg: '#F1F3F5', main: '#B9C2C9', text: '#8C969D' },
  },
  occupancy: {
    low: '#20A66A',
    moderate: '#E0A936',
    high: '#F07B3A',
    critical: '#E4514C',
  },
  route: {
    fastest: '#2F8ED8',
    safest: '#19AFA4',
    balanced: '#586FB7',
    incident: '#E4514C',
    closed: '#9A4D4A',
    alternate: '#F1A33C',
  },
} as const;

// ---------------------------------------------------------------------------
// 2.7 Gradients
// ---------------------------------------------------------------------------

export const gradients = {
  primaryHeader: ['#2E70BA', '#388AD9'] as const,
  mobility: ['#388AD9', '#21C6B7'] as const,
  tealAction: ['#159E98', '#28C8BA'] as const,
  navigationDark: ['#0F607E', '#173E70'] as const,
  imageOverlay: ['rgba(16, 44, 79, 0)', 'rgba(16, 44, 79, 0.72)'] as const,
} as const;

// ---------------------------------------------------------------------------
// 3.2 Font Families
// ---------------------------------------------------------------------------

export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

// ---------------------------------------------------------------------------
// 4.1 Spacing (8-point grid)
// ---------------------------------------------------------------------------

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

// ---------------------------------------------------------------------------
// 5. Shape and Radius
// ---------------------------------------------------------------------------

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  '2xl': 28,
  pill: 999,
} as const;

// ---------------------------------------------------------------------------
// 3.3 Typography
// ---------------------------------------------------------------------------

const weight400: TextStyle['fontWeight'] = '400';
const weight500: TextStyle['fontWeight'] = '500';
const weight600: TextStyle['fontWeight'] = '600';
const weight700: TextStyle['fontWeight'] = '700';
const weight800: TextStyle['fontWeight'] = '800';

export const typography = {
  displayLg: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: weight800,
  },
  displayMd: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: weight700,
  },
  headingLg: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: weight700,
  },
  headingMd: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: weight700,
  },
  headingSm: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: weight600,
  },
  bodyLg: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: weight400,
  },
  bodyMd: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: weight400,
  },
  bodySm: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: weight400,
  },
  labelLg: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: weight600,
  },
  labelMd: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: weight600,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: weight500,
  },
  micro: {
    fontFamily: fontFamilies.medium,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: weight500,
  },
} as const;

// ---------------------------------------------------------------------------
// 4. Layout
// ---------------------------------------------------------------------------

export const layout = {
  screenPadding: 16,
  sectionGap: 24,
  cardGap: 12,
  buttonHeight: 50,
  inputHeight: 48,
  bottomTabHeight: 68,
  minTouchTarget: 44,
} as const;

// ---------------------------------------------------------------------------
// 6. Shadows
// ---------------------------------------------------------------------------

export const shadows = {
  sm: {
    shadowColor: '#173E70',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#173E70',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#173E70',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;

// ---------------------------------------------------------------------------
// 12. Motion
// ---------------------------------------------------------------------------

export const motion = {
  fast: 120,
  normal: 200,
  slow: 320,
  routeTransition: 450,
} as const;

// ---------------------------------------------------------------------------
// 7. Icon Sizes
// ---------------------------------------------------------------------------

export const iconSizes = {
  inline: 14,
  badge: 16,
  button: 20,
  navigation: 22,
  header: 24,
  empty: 48,
} as const;

// ---------------------------------------------------------------------------
// Combined Theme
// ---------------------------------------------------------------------------

export const theme = {
  colors,
  gradients,
  fontFamilies,
  spacing,
  radii,
  typography,
  layout,
  shadows,
  motion,
  iconSizes,
} as const;

export type AppTheme = typeof theme;

// ---------------------------------------------------------------------------
// Type Helpers
// ---------------------------------------------------------------------------

export type OccupancyLevel = keyof typeof colors.occupancy;
export type RouteMode = 'fastest' | 'safest' | 'balanced';
export type SemanticStatus = keyof typeof colors.semantic;
export type TypographyVariant = keyof typeof typography;

// ---------------------------------------------------------------------------
// Legacy Exports (backward-compatible with Expo starter components)
// TODO: Remove after full migration to NADI design system
// ---------------------------------------------------------------------------



/** @deprecated Use `colors` instead */
export const Colors = {
  light: {
    text: colors.neutral.textPrimary,
    background: colors.neutral.surfaceSoft,
    backgroundElement: colors.neutral.surfaceMuted,
    backgroundSelected: colors.neutral.borderSoft,
    textSecondary: colors.neutral.textSecondary,
  },
  dark: {
    text: colors.neutral.white,
    background: colors.neutral.black,
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

/** @deprecated */
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** @deprecated Use `fontFamilies` instead */
export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

/** @deprecated Use `spacing` instead */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** @deprecated */
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

/** @deprecated */
export const MaxContentWidth = 800;

