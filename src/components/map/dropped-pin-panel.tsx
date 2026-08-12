import { LogOut, Navigation } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton, AppCard, AppText, IconButton } from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';

export type DroppedPinPanelProps = {
  coordinateLabel: string;
  onRouteHere: () => void;
  onDepartHere: () => void;
  onClear: () => void;
};

/**
 * A bare coordinate the user tapped. It can become an origin or a destination,
 * but it never receives NADI crowd, parking, or safety readings — NADI has no
 * coverage for an arbitrary point.
 */
export function DroppedPinPanel({
  coordinateLabel,
  onRouteHere,
  onDepartHere,
  onClear,
}: DroppedPinPanelProps) {
  const { t } = useTranslation('screens');

  return (
    <AppCard variant="elevated" style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {t('map.panel.droppedPinTitle')}
          </AppText>
          <AppText variant="headingSm">{coordinateLabel}</AppText>
        </View>
        <IconButton
          accessibilityLabel={t('common.close')}
          icon={
            <LogOut size={iconSizes.button} color={colors.neutral.textSecondary} />
          }
          onPress={onClear}
        />
      </View>

      <AppText variant="caption" color={colors.neutral.textSecondary}>
        {t('map.panel.pointNoIntelligence')}
      </AppText>

      <View style={styles.actionRow}>
        <View style={styles.actionItem}>
          <AppButton
            fullWidth
            size="sm"
            variant="secondary"
            label={t('map.panel.departFromHere')}
            onPress={onDepartHere}
          />
        </View>
        <View style={styles.actionItem}>
          <AppButton
            fullWidth
            size="sm"
            label={t('map.panel.routeToHere')}
            leadingIcon={
              <Navigation size={iconSizes.button} color={colors.neutral.white} />
            }
            onPress={onRouteHere}
          />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing[2],
    padding: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionItem: {
    flex: 1,
  },
});
