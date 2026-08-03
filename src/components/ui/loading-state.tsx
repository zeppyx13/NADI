import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { AppText } from './app-text';

export type LoadingStateProps = {
  title?: string;
  description?: string;
};

export function LoadingState({ title, description }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.brand[500]} />
      {title && (
        <AppText variant="headingSm" color={colors.neutral.textPrimary} style={styles.title}>
          {title}
        </AppText>
      )}
      {description && (
        <AppText variant="bodyMd" color={colors.neutral.textSecondary} style={styles.description}>
          {description}
        </AppText>
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
  title: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
  description: {
    marginTop: spacing[2],
    textAlign: 'center',
  },
});
