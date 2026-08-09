import { Clock3, MapPin, Navigation, Route } from 'lucide-react-native';
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

export type MapScreenMode =
  | 'explore'
  | 'destination-selected'
  | 'route-preview';

export type MapInfoPanelProps = {
  mode: MapScreenMode;
  selectedDestination?: Destination;
  routeMode: RouteMode;
  onFindDestination: () => void;
  onChooseDestination: () => void;
  onViewDetail: () => void;
  onRouteModeChange: (mode: RouteMode) => void;
  onStartJourney: () => void;
  journeyActionLabel?: string;
  secondaryJourneyAction?: {
    label: string;
    onPress: () => void;
  };
};

const routeModes: readonly RouteMode[] = ['fastest', 'safest', 'balanced'];

export function MapInfoPanel({
  mode,
  selectedDestination,
  routeMode,
  onFindDestination,
  onChooseDestination,
  onViewDetail,
  onRouteModeChange,
  onStartJourney,
  journeyActionLabel,
  secondaryJourneyAction,
}: MapInfoPanelProps) {
  const { t } = useTranslation('screens');

  if (mode === 'explore' || !selectedDestination) {
    return (
      <AppCard variant="elevated" style={styles.panel}>
        <View style={styles.headingRow}>
          <View style={styles.headingIcon}>
            <MapPin size={iconSizes.header} color={colors.brand[600]} />
          </View>
          <View style={styles.copy}>
            <AppText variant="headingSm">{t('map.panel.exploreTitle')}</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('map.panel.exploreSummary')}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" color={colors.neutral.textSecondary}>
          {t('map.panel.nearest')}
        </AppText>
        <AppButton
          fullWidth
          label={t('map.panel.findDestination')}
          onPress={onFindDestination}
        />
      </AppCard>
    );
  }

  if (mode === 'destination-selected') {
    return (
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
          <OccupancyBadge level={selectedDestination.occupancyLevel} size="sm" />
        </View>
        <View style={styles.inlineMeta}>
          <Clock3 size={iconSizes.inline} color={colors.brand[600]} />
          <AppText variant="labelMd" color={colors.brand[700]}>
            {t('map.panel.estimate', {
              minutes: selectedDestination.estimatedTravelMinutes,
            })}
          </AppText>
        </View>
        <AppButton
          fullWidth
          label={t('map.panel.chooseDestination')}
          leadingIcon={<Navigation size={iconSizes.button} color={colors.neutral.white} />}
          onPress={onChooseDestination}
        />
        <AppButton
          fullWidth
          variant="secondary"
          label={t('map.panel.viewDetail')}
          onPress={onViewDetail}
        />
      </AppCard>
    );
  }

  return (
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
                color={selected ? colors.brand[700] : colors.neutral.textSecondary}
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
        variant="teal"
        label={journeyActionLabel ?? t('map.panel.startJourney')}
        leadingIcon={<Navigation size={iconSizes.button} color={colors.neutral.white} />}
        onPress={onStartJourney}
      />
      {secondaryJourneyAction && (
        <AppButton
          fullWidth
          variant="secondary"
          label={secondaryJourneyAction.label}
          onPress={secondaryJourneyAction.onPress}
        />
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing[3],
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
