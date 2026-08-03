import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { AppText } from './app-text';
import { AppButton } from './app-button';

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <AppText variant="headingSm" color={colors.neutral.textPrimary} style={styles.title}>
        {title}
      </AppText>
      <AppText variant="bodyMd" color={colors.neutral.textSecondary} style={styles.description}>
        {description}
      </AppText>
      {action && (
        <View style={styles.actionContainer}>
          <AppButton 
            label={action.label} 
            onPress={action.onPress} 
            variant="secondary"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  iconContainer: {
    marginBottom: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: spacing[6],
  },
});
