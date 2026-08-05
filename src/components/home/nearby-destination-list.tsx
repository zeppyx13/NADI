import { Image } from 'expo-image';
import { Clock3, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PhotoAttribution } from '@/components/media/photo-attribution';
import { OccupancyBadge } from '@/components/status/occupancy-badge';
import { AppBadge, AppCard, AppText, SectionHeader } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import { useDestinationImage } from '@/hooks/use-destination-image';

import type { HomeDestinationItem } from './recommendation-carousel';

const destinationFallbackImage = require('@/assets/images/logo-glow.png');

export type NearbyDestinationListProps = {
  items: readonly HomeDestinationItem[];
  onSelectDestination: (destinationId: string) => void;
};

type NearbyDestinationItemProps = {
  item: HomeDestinationItem;
  onPress: () => void;
};

function NearbyDestinationItem({ item, onPress }: NearbyDestinationItemProps) {
  const { t, i18n } = useTranslation(['home', 'screens']);
  const { destination, insight } = item;
  const { photo, imageUrl, handleImageError } = useDestinationImage(
    destination.id,
    destination.imageQuery,
  );
  const formattedDistance = new Intl.NumberFormat(
    i18n.language === 'id' ? 'id-ID' : 'en-US',
    { maximumFractionDigits: 1 },
  ).format(insight.distanceKm);

  return (
    <AppCard style={styles.card}>
      <View style={styles.row}>
        <Image
          source={imageUrl ? { uri: imageUrl } : destinationFallbackImage}
          placeholder={photo?.blur_hash ? { blurhash: photo.blur_hash } : undefined}
          placeholderContentFit="cover"
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
          accessible
          accessibilityLabel={t('image.destinationAccessibility', {
            ns: 'home',
            name: destination.name,
          })}
          onError={handleImageError}
          style={styles.image}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('nearby.openDestination', {
            ns: 'home',
            name: destination.name,
          })}
          onPress={onPress}
          style={({ pressed }) => [styles.content, pressed && styles.pressed]}
        >
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <AppText variant="headingSm" numberOfLines={2}>
                {destination.name}
              </AppText>
              <View style={styles.inlineMeta}>
                <MapPin size={iconSizes.inline} color={colors.neutral.iconMuted} />
                <AppText
                  variant="caption"
                  color={colors.neutral.textSecondary}
                  numberOfLines={1}
                  style={styles.region}
                >
                  {destination.region}
                </AppText>
              </View>
            </View>
            <OccupancyBadge level={destination.occupancyLevel} size="sm" />
          </View>
          <View style={styles.details}>
            <AppBadge
              size="sm"
              variant="info"
              label={t(`explore.category.${destination.category}`, { ns: 'screens' })}
            />
            <View style={styles.inlineMeta}>
              <MapPin size={iconSizes.inline} color={colors.brand[600]} />
              <AppText variant="caption" color={colors.brand[700]}>
                {t('nearby.distanceAway', {
                  ns: 'home',
                  distance: formattedDistance,
                })}
              </AppText>
            </View>
            <View style={styles.inlineMeta}>
              <Clock3 size={iconSizes.inline} color={colors.teal[700]} />
              <AppText variant="caption" color={colors.teal[700]}>
                {t('nearby.travelTime', {
                  ns: 'home',
                  minutes: insight.etaMinutes,
                })}
              </AppText>
            </View>
          </View>
        </Pressable>
      </View>
      {photo && (
        <PhotoAttribution
          compact
          tone="surface"
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
      )}
    </AppCard>
  );
}

export function NearbyDestinationList({
  items,
  onSelectDestination,
}: NearbyDestinationListProps) {
  const { t } = useTranslation('home');

  if (items.length === 0) return null;

  return (
    <View>
      <SectionHeader title={t('nearby.title')} subtitle={t('nearby.subtitle')} />
      <View style={styles.list}>
        {items.slice(0, 3).map((item) => (
          <NearbyDestinationItem
            key={item.destination.id}
            item={item}
            onPress={() => onSelectDestination(item.destination.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing[3],
  },
  card: {
    gap: spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing[3],
  },
  image: {
    width: 96,
    minHeight: 116,
    borderRadius: radii.md,
    backgroundColor: colors.brand[100],
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: spacing[2],
    borderRadius: radii.md,
  },
  pressed: {
    opacity: 0.72,
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
  region: {
    flex: 1,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[2],
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
});
