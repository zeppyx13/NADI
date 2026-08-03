import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { colors, iconSizes, spacing } from '@/constants/theme';
import { AppText } from './app-text';
import { AppButton } from './app-button';

export type ErrorStateProps = {
  title?: string;
  description: string;
  onRetry?: () => void;
};

export function ErrorState({ title = 'Terjadi Kesalahan', description, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertTriangle size={iconSizes.empty} color={colors.semantic.danger.main} />
      </View>
      <AppText variant="headingSm" color={colors.neutral.textPrimary} style={styles.title}>
        {title}
      </AppText>
      <AppText variant="bodyMd" color={colors.neutral.textSecondary} style={styles.description}>
        {description}
      </AppText>
      {onRetry && (
        <View style={styles.actionContainer}>
          <AppButton 
            label="Coba Lagi" 
            onPress={onRetry} 
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
