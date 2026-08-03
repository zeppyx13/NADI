import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { colors, radii, spacing, iconSizes } from '@/constants/theme';
import { type OccupancyLevel } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';

const occupancyLabels: Record<OccupancyLevel, string> = {
  low: 'Sepi',
  moderate: 'Sedang',
  high: 'Ramai',
  critical: 'Padat',
};

export type OccupancyBadgeProps = {
  level: OccupancyLevel;
  size?: 'sm' | 'md';
};

export function OccupancyBadge({ level, size = 'md' }: OccupancyBadgeProps) {
  const color = colors.occupancy[level];
  const label = occupancyLabels[level];
  const isSm = size === 'sm';
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color + '26' }, // 15% opacity
        isSm && styles.containerSm,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Tingkat kepadatan: ${label}`}
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
