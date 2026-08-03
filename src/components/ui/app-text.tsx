import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography, type TypographyVariant } from '@/constants/theme';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
};

export function AppText({ variant = 'bodyMd', color, style, ...rest }: AppTextProps) {
  const variantStyle = typography[variant];
  return (
    <Text
      style={[
        {
          color: color ?? colors.neutral.textPrimary,
          fontFamily: variantStyle.fontFamily,
          fontSize: variantStyle.fontSize,
          lineHeight: variantStyle.lineHeight,
          fontWeight: variantStyle.fontWeight as TextStyle['fontWeight'],
        },
        style,
      ]}
      {...rest}
    />
  );
}
