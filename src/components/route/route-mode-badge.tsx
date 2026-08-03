import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Zap, Shield, Scale } from 'lucide-react-native';
import { colors, radii, spacing, iconSizes } from '@/constants/theme';
import { type RouteMode } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';

const routeModeLabels: Record<RouteMode, string> = {
  fastest: 'Tercepat',
  safest: 'Teraman',
  balanced: 'Seimbang',
};

const routeModeIcons = {
  fastest: Zap,
  safest: Shield,
  balanced: Scale,
};

export type RouteModeBadgeProps = {
  mode: RouteMode;
};

export function RouteModeBadge({ mode }: RouteModeBadgeProps) {
  const color = colors.route[mode];
  const label = routeModeLabels[mode];
  const Icon = routeModeIcons[mode];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color + '26' }, // 15% opacity
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Mode rute: ${label}`}
    >
      <Icon size={iconSizes.badge} color={color} strokeWidth={2} />
      <AppText variant="labelMd" color={color}>
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
});
