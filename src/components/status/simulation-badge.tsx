import React from 'react';
import { FlaskConical } from 'lucide-react-native';
import { AppBadge } from '@/components/ui/app-badge';
import { colors, iconSizes } from '@/constants/theme';

export type SimulationBadgeProps = {
  label?: string;
};

export function SimulationBadge({ label = 'Prediksi Sistem' }: SimulationBadgeProps) {
  return (
    <AppBadge
      variant="simulation"
      label={label}
      icon={(
        <FlaskConical
          size={iconSizes.badge}
          color={colors.brand[700]}
        />
      )}
    />
  );
}
