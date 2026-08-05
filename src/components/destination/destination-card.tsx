import { Image } from 'expo-image';
import { Clock3, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PhotoAttribution } from '@/components/media/photo-attribution';
import { OccupancyBadge } from '@/components/status/occupancy-badge';
import { AppBadge, AppCard, AppText } from '@/components/ui';
import {
  colors,
  iconSizes,
  radii,
  spacing,
  type OccupancyLevel,
} from '@/constants/theme';
import { useDestinationImage } from '@/hooks/use-destination-image';
import type { Destination } from '@/types/destination';

const destinationImage = require('@/assets/images/logo-glow.png');

export type DestinationCardProps = {
  destination: Destination;
  compact?: boolean;
  predictedOccupancyLevel?: OccupancyLevel;
  recommendationReason?: string;
  showRecommendationReason?: boolean;
  onPress?: () => void;
};

export function DestinationCard({
  destination,
  compact = false,
  predictedOccupancyLevel,
  recommendationReason,
  showRecommendationReason = !compact,
  onPress,
}: DestinationCardProps) {
  const { t } = useTranslation(['screens', 'home']);
  const { photo, imageUrl, handleImageError } = useDestinationImage(
    destination.id,
    destination.imageQuery,
  );
  const imageSource = imageUrl ? { uri: imageUrl } : destinationImage;

  return (
    <AppCard
      variant="elevated"
      style={compact ? styles.compactCard : styles.card}
    >
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          placeholder={photo?.blur_hash ? { blurhash: photo.blur_hash } : undefined}
          placeholderContentFit="cover"
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
          accessibilityLabel={t('image.destinationAccessibility', {
            ns: 'home',
            name: destination.name,
          })}
          accessible
          onError={handleImageError}
          style={[styles.image, compact && styles.compactImage]}
        />
        {onPress && (
          <Pressable
            accessible={false}
            onPress={onPress}
            style={StyleSheet.absoluteFill}
          />
        )}
        {photo && (
          <View style={styles.attributionOverlay}>
            <PhotoAttribution
              compact
              photo={photo}
              credit={t('image.photoCredit', {
                ns: 'home',
                name: photo.user.name,
              })}
              accessibilityLabel={t('image.photoCreditAccessibility', {
                ns: 'home',
                name: photo.user.name,
              })}
            />
          </View>
        )}
      </View>
      <Pressable
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={
          onPress
            ? t('explore.openDestination', {
                ns: 'screens',
                name: destination.name,
              })
            : undefined
        }
        onPress={onPress}
        style={({ pressed }) => [styles.content, pressed && styles.contentPressed]}
      >
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

        {predictedOccupancyLevel && (
          <View style={styles.predictionRow}>
            <AppText variant="caption" color={colors.neutral.textSecondary}>
              {t('recommendations.predictedAtArrival', { ns: 'home' })}
            </AppText>
            <OccupancyBadge level={predictedOccupancyLevel} size="sm" />
          </View>
        )}

        {showRecommendationReason && (
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {recommendationReason ??
              t(`explore.recommendation.${destination.recommendationReasonKey}`, {
                ns: 'screens',
              })}
          </AppText>
        )}
      </Pressable>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  compactCard: {
    width: 292,
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
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
    height: 148,
  },
  attributionOverlay: {
    position: 'absolute',
    right: spacing[3],
    bottom: 0,
    left: spacing[3],
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[2],
    borderRadius: radii.sm,
    backgroundColor: colors.neutral.navy,
  },
  content: {
    padding: spacing[4],
    gap: spacing[3],
  },
  contentPressed: {
    backgroundColor: colors.brand[50],
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
  predictionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
});
