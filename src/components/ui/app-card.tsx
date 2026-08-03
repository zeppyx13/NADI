import React, { type ReactNode } from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '@/constants/theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'soft';

export type AppCardProps = {
  children: ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function AppCard({
  children,
  variant = 'default',
  style,
  onPress,
  accessibilityLabel,
}: AppCardProps) {
  const getCardStyle = () => {
    switch (variant) {
      case 'elevated':
        return [styles.base, styles.elevated];
      case 'outlined':
        return [styles.base, styles.outlined];
      case 'soft':
        return [styles.base, styles.soft];
      case 'default':
      default:
        return [styles.base, styles.defaultVariant];
    }
  };

  const RootComponent = onPress ? Pressable : View;

  return (
    <RootComponent 
      style={({ pressed }) => [
        getCardStyle(),
        style,
        onPress && pressed && { opacity: 0.8 }
      ]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  defaultVariant: {
    backgroundColor: colors.neutral.white,
    borderColor: colors.neutral.borderSoft,
    borderWidth: 1,
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.neutral.white,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: colors.neutral.white,
    borderColor: colors.neutral.borderStrong,
    borderWidth: 1,
  },
  soft: {
    backgroundColor: colors.neutral.surfaceMuted,
  },
});
