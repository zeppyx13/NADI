import { Image } from 'expo-image';
import { Clock3, MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OccupancyBadge } from '@/components/status/occupancy-badge';
import { AppBadge, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type { Destination } from '@/types/destination';

const destinationImage = require('@/assets/images/logo-glow.png');

export type DestinationCardProps = {
  destination: Destination;
  compact?: boolean;
  onPress?: () => void;
};

export function DestinationCard({
  destination,
  compact = false,
  onPress,
}: DestinationCardProps) {
  const { t } = useTranslation('screens');

  return (
    <AppCard
      variant="elevated"
      onPress={onPress}
      accessibilityLabel={t('explore.openDestination', { name: destination.name })}
      style={compact ? styles.compactCard : styles.card}
    >
      <Image
        source={destinationImage}
        contentFit="cover"
        transition={150}
        style={[styles.image, compact && styles.compactImage]}
      />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <AppText variant="headingSm" numberOfLines={1}>
              {destination.name}
            </AppText>
            <View style={styles.metaRow}>
              <MapPin size={iconSizes.inline} color={colors.neutral.iconMuted} />
              <AppText
                variant="caption"
                color={colors.neutral.textSecondary}
                numberOfLines={1}
                style={styles.metaText}
              >
                {destination.region}
              </AppText>
            </View>
          </View>
          <OccupancyBadge level={destination.occupancyLevel} size="sm" />
        </View>

        <View style={styles.badgeRow}>
          <AppBadge
            size="sm"
            variant="info"
            label={t(`explore.category.${destination.category}`)}
          />
          <View style={styles.travelTime}>
            <Clock3 size={iconSizes.inline} color={colors.brand[600]} />
            <AppText variant="caption" color={colors.brand[700]}>
              {t('explore.travelEstimate', {
                minutes: destination.estimatedTravelMinutes,
              })}
            </AppText>
          </View>
        </View>

        {!compact && (
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t(`explore.recommendation.${destination.recommendationReasonKey}`)}
          </AppText>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  compactCard: {
    width: 280,
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 132,
    backgroundColor: colors.brand[100],
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  compactImage: {
    height: 112,
  },
  content: {
    padding: spacing[4],
    gap: spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  titleCopy: {
    flex: 1,
    gap: spacing[1],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[2],
  },
  travelTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
});
