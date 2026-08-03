import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { AppText } from './app-text';

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
};

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <AppText variant="headingMd" color={colors.neutral.textPrimary}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="bodySm" color={colors.neutral.textSecondary} style={styles.subtitle}>
            {subtitle}
          </AppText>
        )}
      </View>
      {action && (
        <Pressable 
          onPress={action.onPress} 
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
        >
          <AppText variant="labelMd" color={colors.brand[500]}>
            {action.label}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  actionButton: {
    paddingLeft: spacing[4],
    paddingVertical: spacing[2],
  },
  actionPressed: {
    opacity: 0.7,
  },
});
