import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, iconSizes, layout } from '@/constants/theme';
import { AppInput, type AppInputProps } from './app-input';

export type SearchFieldProps = Omit<AppInputProps, 'leadingIcon' | 'trailingIcon'> & {
  onClear?: () => void;
  clearAccessibilityLabel?: string;
};

export function SearchField({
  value,
  placeholder = 'Cari...',
  onClear,
  clearAccessibilityLabel = 'Clear search',
  ...rest
}: SearchFieldProps) {
  const hasValue = value && value.length > 0;

  return (
    <AppInput
      value={value}
      placeholder={placeholder}
      accessibilityLabel="Cari"
      leadingIcon={<Search size={iconSizes.inline} color={colors.neutral.iconMuted} />}
      trailingIcon={
        hasValue && onClear ? (
          <Pressable
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel={clearAccessibilityLabel}
            hitSlop={8}
            style={styles.clearButton}
          >
            <X size={iconSizes.inline} color={colors.neutral.iconMuted} />
          </Pressable>
        ) : undefined
      }
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  clearButton: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
