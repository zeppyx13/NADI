import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

export type MainScreenHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rightAction?: ReactNode;
};

export function MainScreenHeader({
  title,
  subtitle,
  eyebrow,
  rightAction,
}: MainScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow && (
          <AppText variant="labelMd" color={colors.brand[600]}>
            {eyebrow}
          </AppText>
        )}
        <AppText variant="headingLg">{title}</AppText>
        {subtitle && (
          <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
            {subtitle}
          </AppText>
        )}
      </View>
      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
});
