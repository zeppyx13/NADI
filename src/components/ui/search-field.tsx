import React from 'react';
import { Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, iconSizes } from '@/constants/theme';
import { AppInput, type AppInputProps } from './app-input';

export type SearchFieldProps = Omit<AppInputProps, 'leadingIcon' | 'trailingIcon'> & {
  onClear?: () => void;
};

export function SearchField({
  value,
  placeholder = 'Cari...',
  onClear,
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
          <Pressable onPress={onClear} accessibilityRole="button" accessibilityLabel="Clear search">
            <X size={iconSizes.inline} color={colors.neutral.iconMuted} />
          </Pressable>
        ) : undefined
      }
      {...rest}
    />
  );
}
