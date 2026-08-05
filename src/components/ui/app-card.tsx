import React, { type ReactNode } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, shadows, spacing } from '@/constants/theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'soft';

export type AppCardProps = {
  children: ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
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

  const cardStyle = [getCardStyle(), style];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={cardStyle}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
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
  pressed: {
    opacity: 0.8,
  },
});
