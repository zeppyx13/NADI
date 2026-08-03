import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors, radii, spacing, iconSizes } from '@/constants/theme';
import { type OccupancyLevel } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';

export type OccupancyBadgeProps = {
  level: OccupancyLevel;
  size?: 'sm' | 'md';
};

export function OccupancyBadge({ level, size = 'md' }: OccupancyBadgeProps) {
  const { t } = useTranslation('screens');
  const color = colors.occupancy[level];
  const label = t(`status.occupancy.${level}`);
  const isSm = size === 'sm';
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color + '26' }, // 15% opacity
        isSm && styles.containerSm,
      ]}
      accessibilityRole="text"
      accessibilityLabel={t('status.occupancy.accessibility', { level: label })}
    >
      <Users
        size={isSm ? iconSizes.inline : iconSizes.badge}
        color={color}
        strokeWidth={2}
      />
      <AppText
        variant={isSm ? 'micro' : 'labelMd'}
        color={color}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    gap: spacing[1],
    minHeight: 28,
  },
  containerSm: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    gap: 2,
    minHeight: 24,
  },
});
