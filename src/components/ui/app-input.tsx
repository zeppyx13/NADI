import React, { useState, type ReactNode } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { colors, radii, spacing, typography, layout } from '@/constants/theme';
import { AppText } from './app-text';

export type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function AppInput({
  label,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  style,
  editable = true,
  ...rest
}: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (!editable) return colors.neutral.borderSoft;
    if (error) return colors.semantic.danger.main;
    if (isFocused) return colors.brand[400];
    return colors.neutral.borderSoft;
  };

  const getBackgroundColor = () => {
    if (!editable) return colors.semantic.disabled.bg;
    return colors.neutral.white;
  };

  return (
    <View style={styles.container}>
      {label && (
        <AppText variant="labelMd" color={colors.neutral.textPrimary} style={styles.label}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
          },
        ]}
      >
        {leadingIcon && <View style={styles.iconLeading}>{leadingIcon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              fontFamily: typography.bodyMd.fontFamily,
              fontSize: typography.bodyMd.fontSize,
              color: editable ? colors.neutral.textPrimary : colors.semantic.disabled.text,
            },
            style,
          ]}
          editable={editable}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.neutral.textMuted}
          {...rest}
        />
        {trailingIcon && <View style={styles.iconTrailing}>{trailingIcon}</View>}
      </View>
      {(error || helperText) && (
        <AppText
          variant="caption"
          color={error ? colors.semantic.danger.text : colors.neutral.textSecondary}
          style={styles.helperText}
        >
          {error || helperText}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing[1],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.inputHeight,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
  },
  input: {
    flex: 1,
    height: '100%',
  },
  iconLeading: {
    marginRight: spacing[2],
  },
  iconTrailing: {
    marginLeft: spacing[2],
  },
  helperText: {
    marginTop: spacing[1],
  },
});
