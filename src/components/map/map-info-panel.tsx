import {
  ChevronRight,
  Clock3,
  Navigation,
  RefreshCw,
  Route,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OccupancyBadge } from '@/components/status/occupancy-badge';
import { AppButton, AppCard, AppText } from '@/components/ui';
import {
  colors,
  iconSizes,
  radii,
  spacing,
  type RouteMode,
} from '@/constants/theme';
import type { Destination } from '@/types/destination';
import type { ItineraryPlace } from '@/types/itinerary';
import type { MapInteractionMode, MapPlaceResult } from '@/types/map';

type MapPanelAction = {
  label: string;
  onPress: () => void;
};

export type MapInfoPanelProps = {
  mode: MapInteractionMode;
  selectedDestination?: Destination;
  selectedPlace?: MapPlaceResult;
  onClearPlace?: () => void;
  activePlace?: ItineraryPlace;
  routeMode: RouteMode;
  selectedTravelMinutes?: number;
  activeArrivalTime?: string;
  activeRemainingCount?: number;
  activeTravelMinutes?: number;
  routeOriginName: string;
  onChooseDestination: () => void;
  onViewDetail: () => void;
  onRouteModeChange: (mode: RouteMode) => void;
  onStartJourney: () => void;
  continueJourneyAction?: MapPanelAction;
  itineraryAction?: MapPanelAction;
  pendingRecommendationAction?: MapPanelAction;
};

const routeModes: readonly RouteMode[] = ['fastest', 'safest', 'balanced'];

export function MapInfoPanel({
  mode,
  selectedDestination,
  selectedPlace,
  onClearPlace,
  activePlace,
  routeMode,
  selectedTravelMinutes,
  activeArrivalTime,
  activeRemainingCount,
  activeTravelMinutes,
  routeOriginName,
  onChooseDestination,
  onViewDetail,
  onRouteModeChange,
  onStartJourney,
  continueJourneyAction,
  itineraryAction,
  pendingRecommendationAction,
}: MapInfoPanelProps) {
  const { t } = useTranslation('screens');

  let panel: ReactNode;

  if (
    (mode === 'active-journey' || mode === 'reoptimization-pending') &&
    (selectedDestination || activePlace)
  ) {
    panel = (
      <AppCard variant="elevated" style={styles.panel}>
        <View style={styles.titleRow}>
          <View style={styles.copy}>
            <AppText variant="caption" color={colors.teal[700]}>
              {t('map.panel.nextDestination')}
            </AppText>
            <AppText variant="headingMd">
              {selectedDestination?.name ?? activePlace?.name}
            </AppText>
            {(activeArrivalTime ||
              activeTravelMinutes !== undefined ||
              activeRemainingCount !== undefined) && (
              <View style={styles.activeMeta}>
                {activeArrivalTime && (
                  <View style={styles.inlineMeta}>
                    <Clock3 size={iconSizes.inline} color={colors.brand[600]} />
                    <AppText
                      variant="labelMd"
                      color={colors.neutral.textSecondary}
                    >
                      {t('map.panel.nextArrival', {
                        time: activeArrivalTime,
                      })}
                    </AppText>
                  </View>
                )}
                {(activeTravelMinutes !== undefined ||
                  activeRemainingCount !== undefined) && (
                  <View style={styles.inlineMeta}>
                    <Route size={iconSizes.inline} color={colors.teal[700]} />
                    <AppText variant="labelMd" color={colors.teal[700]}>
                      {activeTravelMinutes !== undefined &&
                        t('map.panel.activeTravelTime', {
                          minutes: activeTravelMinutes,
                        })}
                      {activeTravelMinutes !== undefined &&
                        activeRemainingCount !== undefined &&
                        ' · '}
                      {activeRemainingCount !== undefined &&
                        t('map.panel.remainingDestinations', {
                          count: activeRemainingCount,
                        })}
                    </AppText>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
        {(itineraryAction ||
          (mode === 'active-journey' && continueJourneyAction)) && (
          <View style={styles.actionRow}>
            {itineraryAction && (
              <View style={styles.actionItem}>
                <AppButton
                  fullWidth
                  size="sm"
                  variant="secondary"
                  label={itineraryAction.label}
                  onPress={itineraryAction.onPress}
                />
              </View>
            )}
            {mode === 'active-journey' && continueJourneyAction && (
              <View style={styles.actionItem}>
                <AppButton
                  fullWidth
                  size="sm"
                  variant="teal"
                  label={continueJourneyAction.label}
                  onPress={continueJourneyAction.onPress}
                />
              </View>
            )}
          </View>
        )}
      </AppCard>
    );
  } else if (mode === 'place-selected' && selectedPlace) {
    panel = (
      <AppCard variant="elevated" style={styles.panel}>
        <View style={styles.titleRow}>
          <View style={styles.copy}>
            <AppText variant="caption" color={colors.neutral.textSecondary}>
              {t('map.panel.placeSource')}
            </AppText>
            <AppText variant="headingMd">{selectedPlace.name}</AppText>
            {selectedPlace.address && (
              <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                {selectedPlace.address}
              </AppText>
            )}
          </View>
        </View>
        <AppText variant="caption" color={colors.neutral.textSecondary}>
          {t('map.panel.placeNoIntelligence')}
        </AppText>
        {onClearPlace && (
          <AppButton
            fullWidth
            size="sm"
            variant="secondary"
            label={t('map.panel.clearPlace')}
            onPress={onClearPlace}
          />
        )}
      </AppCard>
    );
  } else if (mode === 'destination-selected' && selectedDestination) {
    panel = (
      <AppCard variant="elevated" style={styles.panel}>
        <View style={styles.titleRow}>
          <View style={styles.copy}>
            <AppText variant="caption" color={colors.brand[600]}>
              {t('map.panel.selectedTitle')}
            </AppText>
            <AppText variant="headingMd">{selectedDestination.name}</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {selectedDestination.regency} ·{' '}
              {t(`explore.category.${selectedDestination.category}`)}
            </AppText>
          </View>
          {selectedDestination.occupancyLevel && (
            <OccupancyBadge level={selectedDestination.occupancyLevel} size="sm" />
          )}
        </View>
        <View style={styles.inlineMeta}>
          <Clock3 size={iconSizes.inline} color={colors.brand[600]} />
          <AppText variant="labelMd" color={colors.brand[700]}>
            {t('map.panel.estimate', {
              minutes:
                selectedTravelMinutes ??
                selectedDestination.estimatedTravelMinutes,
            })}
          </AppText>
        </View>
        <View style={styles.actionRow}>
          <View style={styles.actionItem}>
            <AppButton
              fullWidth
              size="sm"
              variant="secondary"
              label={t('map.panel.viewDetail')}
              onPress={onViewDetail}
            />
          </View>
          <View style={styles.actionItem}>
            <AppButton
              fullWidth
              size="sm"
              label={t('map.panel.chooseDestination')}
              leadingIcon={
                <Navigation size={iconSizes.button} color={colors.neutral.white} />
              }
              onPress={onChooseDestination}
            />
          </View>
        </View>
      </AppCard>
    );
  } else if (mode === 'route-preview' && selectedDestination) {
    panel = (
      <AppCard variant="elevated" style={styles.panel}>
        <View style={styles.headingRow}>
          <View style={styles.headingIcon}>
            <Route size={iconSizes.header} color={colors.brand[600]} />
          </View>
          <View style={styles.copy}>
            <AppText variant="headingSm">{t('map.panel.routeTitle')}</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {routeOriginName} → {selectedDestination.name}
            </AppText>
          </View>
          <AppText variant="labelLg" color={colors.brand[700]}>
            {t('map.panel.etaValue', {
              minutes:
                selectedTravelMinutes ??
                selectedDestination.estimatedTravelMinutes,
            })}
          </AppText>
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

        <AppButton
          fullWidth
          size="sm"
          variant="teal"
          label={t('map.panel.startJourney')}
          leadingIcon={
            <Navigation size={iconSizes.button} color={colors.neutral.white} />
          }
          onPress={onStartJourney}
        />
      </AppCard>
    );
  } else {
    panel = null;
  }

  if (!panel && !pendingRecommendationAction) return null;

  return (
    <View style={styles.container}>
      {pendingRecommendationAction && (
        <View style={styles.reoptimizationBanner}>
          <RefreshCw size={iconSizes.button} color={colors.semantic.warning.text} />
          <AppText
            variant="labelMd"
            color={colors.semantic.warning.text}
            style={styles.bannerCopy}
          >
            {t('map.pendingRecommendation')}
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={pendingRecommendationAction.onPress}
            style={({ pressed }) => [
              styles.bannerAction,
              pressed && styles.routeModePressed,
            ]}
          >
            <AppText variant="labelMd" color={colors.semantic.warning.text}>
              {pendingRecommendationAction.label}
            </AppText>
            <ChevronRight
              size={iconSizes.inline}
              color={colors.semantic.warning.text}
            />
          </Pressable>
        </View>
      )}
      {panel}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  activeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionItem: {
    flex: 1,
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
  reoptimizationBanner: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingLeft: spacing[3],
    paddingRight: spacing[2],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.semantic.warning.main,
    backgroundColor: colors.semantic.warning.bg,
  },
  bannerCopy: {
    flex: 1,
  },
  bannerAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radii.sm,
  },
});
