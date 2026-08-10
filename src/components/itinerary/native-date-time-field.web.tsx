import { CalendarDays, Clock3 } from 'lucide-react-native';
import type { ChangeEvent } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  radii,
  spacing,
  typography,
} from '@/constants/theme';
import type { NativeDateTimeFieldProps } from './native-date-time-field';

function getInputValue(value: Date, mode: 'date' | 'time') {
  if (mode === 'time') {
    return `${String(value.getHours()).padStart(2, '0')}:${String(
      value.getMinutes(),
    ).padStart(2, '0')}`;
  }
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function NativeDateTimeField({
  label,
  value,
  mode,
  onChange,
  minimumDate,
  accessibilityLabel,
}: NativeDateTimeFieldProps) {
  const Icon = mode === 'date' ? CalendarDays : Clock3;
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (!nextValue) return;
    const next = new Date(value);
    if (mode === 'date') {
      const [year, month, day] = nextValue.split('-').map(Number);
      next.setFullYear(year, month - 1, day);
    } else {
      const [hours, minutes] = nextValue.split(':').map(Number);
      next.setHours(hours, minutes, 0, 0);
    }
    onChange(next);
  };

  return (
    <View style={styles.fieldGroup}>
      <AppText variant="labelMd">{label}</AppText>
      <View style={styles.field}>
        <Icon size={iconSizes.button} color={colors.brand[600]} />
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          value={getInputValue(value, mode)}
          onChange={handleChange as never}
          // React Native Web forwards these DOM-only props to the input element.
          {...({
            type: mode,
            min: minimumDate ? getInputValue(minimumDate, 'date') : undefined,
          } as Record<string, unknown>)}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: spacing[1],
  },
  field: {
    minHeight: layout.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.white,
  },
  input: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    fontFamily: typography.bodyLg.fontFamily,
    fontSize: typography.bodyLg.fontSize,
    color: colors.neutral.textPrimary,
  },
});
