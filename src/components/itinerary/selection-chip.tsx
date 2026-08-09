import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, iconSizes, layout, radii, spacing } from '@/constants/theme';

export type SelectionChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function SelectionChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: SelectionChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {selected && <Check size={iconSizes.inline} color={colors.neutral.white} />}
      <AppText
        variant="labelMd"
        color={selected ? colors.neutral.white : colors.neutral.textSecondary}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.white,
  },
  selected: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[600],
  },
  pressed: {
    opacity: 0.72,
  },
});
