import { Navigation } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';
import type { MapPlaceResult } from '@/types/map';

export type PlaceDetailPanelProps = {
  place: MapPlaceResult;
  onRouteToPlace: () => void;
  onClear: () => void;
};

/**
 * A Google Places result. Routing to it is allowed, but NADI never invents
 * crowd, parking, or safety readings for a place outside its catalog.
 */
export function PlaceDetailPanel({
  place,
  onRouteToPlace,
  onClear,
}: PlaceDetailPanelProps) {
  const { t } = useTranslation('screens');

  return (
    <AppCard variant="elevated" style={styles.panel}>
      <View style={styles.copy}>
        <AppText variant="caption" color={colors.neutral.textSecondary}>
          {t('map.panel.placeSource')}
        </AppText>
        <AppText variant="headingMd">{place.name}</AppText>
        {place.address && (
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {place.address}
          </AppText>
        )}
      </View>

      <AppText variant="caption" color={colors.neutral.textSecondary}>
        {t('map.panel.placeNoIntelligence')}
      </AppText>

      <View style={styles.actionRow}>
        <View style={styles.actionItem}>
          <AppButton
            fullWidth
            size="sm"
            variant="secondary"
            label={t('map.panel.clearPlace')}
            onPress={onClear}
          />
        </View>
        <View style={styles.actionItem}>
          <AppButton
            fullWidth
            size="sm"
            label={t('map.panel.routeToPlace')}
            leadingIcon={
              <Navigation size={iconSizes.button} color={colors.neutral.white} />
            }
            onPress={onRouteToPlace}
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
  copy: {
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
