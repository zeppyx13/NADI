import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '@/constants/theme';
import { AppText } from './app-text';

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'simulation';
type BadgeSize = 'sm' | 'md';

export type AppBadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
};

export function AppBadge({ label, variant = 'neutral', size = 'md', icon }: AppBadgeProps) {
  const getColors = () => {
    switch (variant) {
      case 'info':
        return { bg: colors.semantic.info.bg, text: colors.semantic.info.text };
      case 'success':
        return { bg: colors.semantic.success.bg, text: colors.semantic.success.text };
      case 'warning':
        return { bg: colors.semantic.warning.bg, text: colors.semantic.warning.text };
      case 'danger':
        return { bg: colors.semantic.danger.bg, text: colors.semantic.danger.text };
      case 'simulation':
        return { bg: colors.brand[50], text: colors.brand[700] };
      case 'neutral':
      default:
        return { bg: colors.neutral.surfaceMuted, text: colors.neutral.textSecondary };
    }
  };

  const c = getColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.bg },
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
      ]}
      accessibilityRole="text"
    >
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <AppText
        variant={size === 'sm' ? 'micro' : 'caption'}
        color={c.text}
        style={styles.text}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  sizeSm: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  sizeMd: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  iconWrapper: {
    marginRight: 4,
  },
  text: {
    textAlign: 'center',
  },
});
