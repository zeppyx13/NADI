import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Zap, Shield, Scale } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors, radii, spacing, iconSizes } from '@/constants/theme';
import { type RouteMode } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';

const routeModeIcons = {
  fastest: Zap,
  safest: Shield,
  balanced: Scale,
};

export type RouteModeBadgeProps = {
  mode: RouteMode;
};

export function RouteModeBadge({ mode }: RouteModeBadgeProps) {
  const { t } = useTranslation('screens');
  const color = colors.route[mode];
  const label = t(`map.panel.${mode}`);
  const Icon = routeModeIcons[mode];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color + '26' }, // 15% opacity
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
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
