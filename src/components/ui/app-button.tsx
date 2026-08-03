import React, { type ReactNode } from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';
import { colors, radii, spacing, layout } from '@/constants/theme';
import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'secondary' | 'teal' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type AppButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
};

export function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  ...rest
}: AppButtonProps) {
  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return variant === 'ghost' ? 'transparent' : colors.semantic.disabled.bg;
    if (variant === 'primary') return pressed ? colors.brand[600] : colors.brand[500];
    if (variant === 'secondary') return pressed ? colors.brand[100] : colors.brand[50];
    if (variant === 'teal') return pressed ? colors.teal[700] : colors.teal[600];
    if (variant === 'danger') return pressed ? colors.semantic.danger.main : colors.semantic.danger.bg;
    if (variant === 'ghost') return pressed ? colors.brand[50] : 'transparent';
    return colors.brand[500];
  };

  const getBorderColor = () => {
    if (disabled) return variant === 'secondary' || variant === 'danger' ? colors.semantic.disabled.main : 'transparent';
    if (variant === 'secondary') return colors.brand[200];
    if (variant === 'danger') return colors.semantic.danger.main;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return colors.semantic.disabled.text;
    if (variant === 'primary' || variant === 'teal') return colors.neutral.white;
    if (variant === 'secondary') return colors.brand[700];
    if (variant === 'danger') return colors.semantic.danger.text;
    if (variant === 'ghost') return colors.brand[500];
    return colors.neutral.white;
  };

  const getHeight = () => {
    if (size === 'sm') return 36;
    if (size === 'md') return 44;
    return 50;
  };

  const textVariant = size === 'sm' ? 'bodySm' : size === 'md' ? 'labelLg' : 'labelLg';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.container,
        {
          height: getHeight(),
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'secondary' || variant === 'danger' ? 1 : 0,
          minWidth: layout.minTouchTarget,
        },
        fullWidth && styles.fullWidth,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {leadingIcon && <View style={styles.iconContainer}>{leadingIcon}</View>}
          <AppText variant={textVariant} color={getTextColor()}>
            {label}
          </AppText>
          {trailingIcon && <View style={styles.iconContainerTrailing}>{trailingIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.md,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing[2],
  },
  iconContainerTrailing: {
    marginLeft: spacing[2],
  },
});
