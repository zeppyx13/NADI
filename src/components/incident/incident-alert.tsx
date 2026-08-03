import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { colors, radii, spacing, shadows, iconSizes } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentAlertProps = {
  title: string;
  description: string;
  severity: IncidentSeverity;
  distance?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
};

export function IncidentAlert({
  title,
  description,
  severity,
  distance,
  action,
  onDismiss,
}: IncidentAlertProps) {
  const isHighSeverity = severity === 'high' || severity === 'critical';
  const semantic = isHighSeverity ? colors.semantic.danger : colors.semantic.warning;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: semantic.bg, borderColor: semantic.main },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AlertTriangle size={iconSizes.button} color={semantic.main} />
          <AppText variant="headingSm" color={semantic.text} style={styles.title}>
            {title}
          </AppText>
        </View>
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Tutup pemberitahuan"
            hitSlop={12}
            style={styles.dismissButton}
          >
            <X size={iconSizes.button} color={semantic.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <AppText variant="bodyMd" color={semantic.text} style={styles.description}>
        {description}
      </AppText>

      {(distance || action) && (
        <View style={styles.footer}>
          {distance ? (
            <AppText variant="labelMd" color={semantic.main}>
              {distance}
            </AppText>
          ) : (
            <View />
          )}
          
          {action && (
            <TouchableOpacity
              onPress={action.onPress}
              accessibilityRole="button"
              style={styles.actionButton}
            >
              <AppText variant="labelMd" color={semantic.main}>
                {action.label}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    borderRadius: radii.md,
    borderWidth: 1,
    ...shadows.md,
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  title: {
    flex: 1,
  },
  dismissButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing[2],
    marginTop: -spacing[2],
  },
  description: {
    paddingLeft: iconSizes.button + spacing[2],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: iconSizes.button + spacing[2],
    marginTop: spacing[2],
  },
  actionButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    minHeight: 44,
    justifyContent: 'center',
  },
});
