import {
  ChevronRight,
  Clock3,
  MapPin,
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

export type MapScreenMode =
  | 'explore'
  | 'destination-selected'
  | 'route-preview'
  | 'active-journey';

type MapPanelAction = {
  label: string;
  onPress: () => void;
};

export type MapInfoPanelProps = {
  mode: MapScreenMode;
  selectedDestination?: Destination;
  activePlace?: ItineraryPlace;
  routeMode: RouteMode;
  activeArrivalTime?: string;
  onFindDestination: () => void;
  onChooseDestination: () => void;
  onViewDetail: () => void;
  onRouteModeChange: (mode: RouteMode) => void;
  onStartJourney: () => void;
  itineraryAction?: MapPanelAction;
  pendingRecommendationAction?: MapPanelAction;
};

const routeModes: readonly RouteMode[] = ['fastest', 'safest', 'balanced'];

export function MapInfoPanel({
  mode,
  selectedDestination,
  activePlace,
  routeMode,
  activeArrivalTime,
  onFindDestination,
  onChooseDestination,
  onViewDetail,
  onRouteModeChange,
  onStartJourney,
  itineraryAction,
  pendingRecommendationAction,
}: MapInfoPanelProps) {
  const { t } = useTranslation('screens');

  let panel: ReactNode;

  if (mode === 'active-journey' && (selectedDestination || activePlace)) {
    panel = (
      <AppCard variant="elevated" style={styles.panel}>
        <View style={styles.titleRow}>
          <View style={styles.copy}>
            <AppText variant="caption" color={colors.teal[700]}>
              {t('map.panel.activeJourney', {
                defaultValue: 'Perjalanan aktif',
              })}
            </AppText>
            <AppText variant="headingMd">
              {selectedDestination?.name ?? activePlace?.name}
            </AppText>
            <View style={styles.activeMeta}>
              {activeArrivalTime && (
                <View style={styles.inlineMeta}>
                  <Clock3 size={iconSizes.inline} color={colors.brand[600]} />
                  <AppText variant="labelMd" color={colors.neutral.textSecondary}>
                    {t('map.panel.nextArrival', {
                      time: activeArrivalTime,
                      defaultValue: 'Tiba {{time}}',
                    })}
                  </AppText>
                </View>
              )}
              <View style={styles.inlineMeta}>
                <Route size={iconSizes.inline} color={colors.teal[700]} />
                <AppText variant="labelMd" color={colors.teal[700]}>
                  {t(`map.panel.${routeMode}`)}
                </AppText>
              </View>
            </View>
          </View>
          {itineraryAction && (
            <AppButton
              size="sm"
              variant="secondary"
              label={itineraryAction.label}
              onPress={itineraryAction.onPress}
            />
          )}
        </View>
      </AppCard>
    );
  } else if (mode === 'explore' || !selectedDestination) {
    panel = (
      <AppCard variant="elevated" style={styles.panel}>
        <View style={styles.headingRow}>
          <View style={styles.headingIcon}>
            <MapPin size={iconSizes.header} color={colors.brand[600]} />
          </View>
          <View style={styles.copy}>
            <AppText variant="headingSm">{t('map.panel.exploreTitle')}</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('map.searchPlaceholder')}
            </AppText>
          </View>
          <AppButton
            size="sm"
            label={t('map.panel.findDestination')}
            onPress={onFindDestination}
          />
        </View>
      </AppCard>
    );
  } else if (mode === 'destination-selected') {
    panel = (
      <AppCard variant="elevated" style={styles.panel}>
        <View style={styles.titleRow}>
          <View style={styles.copy}>
            <AppText variant="caption" color={colors.brand[600]}>
              {t('map.panel.selectedTitle')}
            </AppText>
            <AppText variant="headingMd">{selectedDestination.name}</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {selectedDestination.region}
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
              minutes: selectedDestination.estimatedTravelMinutes,
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
  } else {
    panel = (
      <AppCard variant="elevated" style={styles.panel}>
        <View style={styles.headingRow}>
          <View style={styles.headingIcon}>
            <Route size={iconSizes.header} color={colors.brand[600]} />
          </View>
          <View style={styles.copy}>
            <AppText variant="headingSm">{t('map.panel.routeTitle')}</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('map.panel.originValue')} → {selectedDestination.name}
            </AppText>
          </View>
          <AppText variant="labelLg" color={colors.brand[700]}>
            {t('map.panel.etaValue', {
              minutes: selectedDestination.estimatedTravelMinutes,
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
  }

  return (
    <View style={styles.container}>
      <AppText
        variant="micro"
        color={colors.neutral.textMuted}
        style={styles.predictionDisclosure}
      >
        {t('map.systemPrediction')}
      </AppText>
      {pendingRecommendationAction && (
        <View style={styles.reoptimizationBanner}>
          <RefreshCw size={iconSizes.button} color={colors.semantic.warning.text} />
          <AppText
            variant="labelMd"
            color={colors.semantic.warning.text}
            style={styles.bannerCopy}
          >
            {t('map.pendingRecommendation', {
              defaultValue: 'Ada perubahan yang disarankan',
            })}
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
  predictionDisclosure: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing[2],
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
