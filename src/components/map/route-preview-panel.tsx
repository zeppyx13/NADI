import { Navigation, Route } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton, AppCard, AppText } from '@/components/ui';
import {
  colors,
  iconSizes,
  radii,
  spacing,
  type RouteMode,
} from '@/constants/theme';
import type { RouteResult, ScoredRoute } from '@/types/route';

export type RoutePreviewPanelProps = {
  originName: string;
  destinationName: string;
  result: RouteResult | null;
  isLoading: boolean;
  routeMode: RouteMode;
  selectedRoute: ScoredRoute | null;
  onRouteModeChange: (mode: RouteMode) => void;
  onStartJourney: () => void;
  /** Explains why starting is not possible, instead of a dead-end alert. */
  notice?: string | null;
};

const routeModes: readonly RouteMode[] = ['fastest', 'safest', 'balanced'];

function formatDistanceKm(meters: number): string {
  return (meters / 1000).toFixed(meters < 10_000 ? 1 : 0);
}

export function RoutePreviewPanel({
  originName,
  destinationName,
  result,
  isLoading,
  routeMode,
  selectedRoute,
  onRouteModeChange,
  onStartJourney,
  notice,
}: RoutePreviewPanelProps) {
  const { t } = useTranslation('screens');
  const minutes = selectedRoute
    ? Math.max(1, Math.round(selectedRoute.candidate.durationSeconds / 60))
    : null;

  return (
    <AppCard variant="elevated" style={styles.panel}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <Route size={iconSizes.header} color={colors.brand[600]} />
        </View>
        <View style={styles.copy}>
          <AppText variant="headingSm">
            {originName} → {destinationName}
          </AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {isLoading
              ? t('map.panel.routeLoading')
              : !selectedRoute || minutes === null
                ? t('map.panel.routeUnavailable')
                : t('map.panel.routeSummary', {
                    minutes,
                    distance: formatDistanceKm(
                      selectedRoute.candidate.distanceMeters,
                    ),
                  })}
          </AppText>
        </View>
      </View>

      <View style={styles.routeModes} accessibilityRole="radiogroup">
        {routeModes.map((item) => {
          const selected = routeMode === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onRouteModeChange(item)}
              style={({ pressed }) => [
                styles.routeMode,
                selected && styles.routeModeSelected,
                pressed && styles.routeModePressed,
              ]}
            >
              <AppText
                variant="labelMd"
                color={
                  selected ? colors.brand[700] : colors.neutral.textSecondary
                }
                style={styles.centered}
              >
                {t(`map.panel.${item}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {selectedRoute && (
        <AppText variant="caption" color={colors.neutral.textSecondary}>
          {t(`map.safetyRisk.${selectedRoute.score.routeRisk}`)}
          {selectedRoute.candidate.isTrafficAware
            ? ` · ${t('map.panel.routeTrafficAware')}`
            : ''}
        </AppText>
      )}

      {result?.status === 'local-fallback' && (
        <AppText variant="caption" color={colors.neutral.textSecondary}>
          {t('map.panel.routeProviderLocal')}
        </AppText>
      )}

      {notice && (
        <AppText variant="caption" color={colors.semantic.warning.text}>
          {notice}
        </AppText>
      )}

      <AppButton
        fullWidth
        size="sm"
        variant="teal"
        disabled={!selectedRoute}
        label={t('map.panel.startJourney')}
        leadingIcon={
          <Navigation size={iconSizes.button} color={colors.neutral.white} />
        }
        onPress={onStartJourney}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing[2],
    padding: spacing[3],
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headingIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.brand[50],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  routeModes: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  routeMode: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    backgroundColor: colors.neutral.white,
  },
  routeModeSelected: {
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  routeModePressed: {
    opacity: 0.72,
  },
  centered: {
    textAlign: 'center',
  },
});
