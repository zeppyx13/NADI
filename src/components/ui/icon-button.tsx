import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps, View } from 'react-native';
import { colors, radii, layout } from '@/constants/theme';

type IconButtonVariant = 'default' | 'soft' | 'solid' | 'danger';

export type IconButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  icon: ReactNode;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
};

export function IconButton({
  icon,
  variant = 'default',
  disabled = false,
  accessibilityLabel,
  ...rest
}: IconButtonProps) {
  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return colors.semantic.disabled.bg;
    if (variant === 'soft') return pressed ? colors.neutral.borderSoft : colors.neutral.surfaceMuted;
    if (variant === 'solid') return pressed ? colors.brand[600] : colors.brand[500];
    if (variant === 'danger') return pressed ? colors.semantic.danger.main : colors.semantic.danger.bg;
    return pressed ? colors.neutral.surfaceMuted : 'transparent';
  };

  const getBorderColor = () => {
    if (variant === 'soft' && !disabled) return colors.neutral.borderSoft;
    return 'transparent';
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'soft' ? 1 : 0,
        },
      ]}
      {...rest}
    >
      <View style={styles.iconWrapper}>{icon}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
