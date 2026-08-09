import { CalendarDays, MapPin, Route } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ItineraryStatusBadge } from '@/components/itinerary/itinerary-status-badge';
import { AppButton, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type { Itinerary } from '@/types/itinerary';
import { formatItineraryDate } from '@/utils/itinerary';

export type ItineraryCardProps = {
  itinerary: Itinerary;
  onPress: () => void;
};

export function ItineraryCard({ itinerary, onPress }: ItineraryCardProps) {
  const { t, i18n } = useTranslation('itinerary');
  const plan = itinerary.approvedPlan ?? itinerary.originalPlan;

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.copy}>
          <AppText variant="headingSm">{itinerary.title}</AppText>
          <View style={styles.metaRow}>
            <CalendarDays size={iconSizes.inline} color={colors.neutral.iconMuted} />
            <AppText variant="caption" color={colors.neutral.textSecondary}>
              {formatItineraryDate(itinerary.date, i18n.language)}
            </AppText>
          </View>
        </View>
        <ItineraryStatusBadge status={itinerary.status} />
      </View>

      <View style={styles.thumbnailRow} accessibilityLabel={t('card.destinations')}>
        {plan.stops.slice(0, 4).map((stop) => (
          <View key={stop.id} style={styles.thumbnail}>
            <MapPin size={iconSizes.inline} color={colors.brand[700]} />
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        <Route size={iconSizes.inline} color={colors.brand[600]} />
        <AppText variant="bodySm" color={colors.neutral.textSecondary}>
          {t('card.summary', {
            count: plan.stops.length,
            start: itinerary.startLocation.name,
          })}
        </AppText>
      </View>
      <AppButton
        fullWidth
        variant="secondary"
        label={t('card.open')}
        onPress={onPress}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  thumbnailRow: {
    flexDirection: 'row',
    minHeight: 42,
    alignItems: 'center',
  },
  thumbnail: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing[2],
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.neutral.white,
    backgroundColor: colors.brand[100],
  },
});
