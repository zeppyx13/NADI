import type { ReactNode } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, iconSizes, layout, radii, spacing } from '@/constants/theme';

export type ProfileMenuItemProps = {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  onPress: () => void;
  trailing?: ReactNode;
};

export function ProfileMenuItem({
  icon: Icon,
  label,
  subtitle,
  onPress,
  trailing,
}: ProfileMenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.iconContainer}>
        <Icon size={iconSizes.button} color={colors.brand[600]} />
      </View>
      <View style={styles.copy}>
        <AppText variant="labelLg">{label}</AppText>
        {subtitle && (
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {subtitle}
          </AppText>
        )}
      </View>
      {trailing ?? (
        <ChevronRight size={iconSizes.button} color={colors.neutral.iconMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: layout.minTouchTarget + spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
  },
  pressed: {
    backgroundColor: colors.brand[50],
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.brand[50],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
