import { Image } from 'expo-image';
import { Clock3, Route } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PhotoAttribution } from '@/components/media/photo-attribution';
import { StopAssessmentBadge } from '@/components/itinerary/stop-assessment-badge';
import { OccupancyBadge } from '@/components/status/occupancy-badge';
import { AppBadge, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import { destinations } from '@/data/destinations';
import { useDestinationImage } from '@/hooks/use-destination-image';
import type {
  ItineraryPlan,
  ItineraryStop,
  StopAssessment,
} from '@/types/itinerary';
import type { Destination } from '@/types/destination';

const fallbackImage = require('@/assets/images/logo-glow.png');

type TimelineStopProps = {
  stop: ItineraryStop;
  assessment?: StopAssessment;
  showImage: boolean;
  isLast: boolean;
};

function CatalogTimelineDestinationImage({
  stop,
  destination,
}: {
  stop: ItineraryStop;
  destination: Destination;
}) {
  const { t } = useTranslation('itinerary');
  const image = useDestinationImage(
    stop.destinationId,
    destination.imageQuery,
  );

  return (
    <View style={styles.imageContainer}>
      <Image
        source={image.imageUrl ? { uri: image.imageUrl } : fallbackImage}
        placeholder={image.photo?.blur_hash ? { blurhash: image.photo.blur_hash } : undefined}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={250}
        onError={image.handleImageError}
        accessibilityLabel={t('timeline.imageAccessibility', {
          name: stop.destinationNameSnapshot,
        })}
        style={styles.image}
      />
      {image.photo && (
        <View style={styles.attribution}>
          <PhotoAttribution
            compact
            photo={image.photo}
            credit={t('timeline.photoCredit', { name: image.photo.user.name })}
            accessibilityLabel={t('timeline.photoCreditAccessibility', {
              name: image.photo.user.name,
            })}
          />
        </View>
      )}
    </View>
  );
}

function TimelineDestinationImage({ stop }: { stop: ItineraryStop }) {
  const { t } = useTranslation('itinerary');
  const destination = destinations.find((item) => item.id === stop.destinationId);

  if (stop.place.source === 'custom-map-point' || !destination) {
    return (
      <View style={styles.imageContainer}>
        <Image
          source={fallbackImage}
          contentFit="cover"
          accessibilityLabel={t('timeline.imageAccessibility', {
            name: stop.destinationNameSnapshot,
          })}
          style={styles.image}
        />
      </View>
    );
  }

  return <CatalogTimelineDestinationImage stop={stop} destination={destination} />;
}

function TimelineStop({ stop, assessment, showImage, isLast }: TimelineStopProps) {
  const { t } = useTranslation('itinerary');
  const condition = assessment?.condition ?? stop.conditionSnapshot;
  const destination = destinations.find((item) => item.id === stop.destinationId);
  const isIntelligenceUnavailable =
    stop.place.source === 'custom-map-point' ||
    destination?.intelligenceCoverage !== 'pilot';

  return (
    <View style={styles.row}>
      <View style={styles.timeColumn}>
        <AppText variant="labelMd" color={colors.brand[700]}>
          {stop.plannedArrival}
        </AppText>
      </View>
      <View style={styles.rail}>
        <View style={styles.dot} />
        {!isLast && <View style={styles.line} />}
      </View>
      <AppCard variant="outlined" style={styles.stopCard}>
        {showImage && <TimelineDestinationImage stop={stop} />}
        <View style={styles.stopCopy}>
          <AppText variant="headingSm">{stop.destinationNameSnapshot}</AppText>
          <View style={styles.badges}>
            {stop.status !== 'upcoming' && (
              <AppBadge
                size="sm"
                variant={stop.status === 'completed' ? 'success' : 'info'}
                label={t(`timeline.stopStatus.${stop.status}`)}
              />
            )}
            {assessment && <StopAssessmentBadge status={assessment.status} />}
            {condition && <OccupancyBadge size="sm" level={condition.occupancy.status} />}
          </View>
          {condition && (
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('timeline.predictedOccupancy', {
                level: t(`occupancy.${condition.occupancy.status}`),
              })}
            </AppText>
          )}
          {!condition && isIntelligenceUnavailable && (
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('timeline.intelligenceUnavailable')}
            </AppText>
          )}
          <View style={styles.metadata}>
            <Clock3 size={iconSizes.inline} color={colors.neutral.iconMuted} />
            <AppText variant="caption" color={colors.neutral.textSecondary}>
              {t('timeline.visitDuration', { minutes: stop.visitDurationMinutes })}
            </AppText>
            {stop.routeToStop && (
              <>
                <Route size={iconSizes.inline} color={colors.neutral.iconMuted} />
                <AppText variant="caption" color={colors.neutral.textSecondary}>
                  {t('timeline.travelDuration', {
                    minutes: stop.routeToStop.estimatedTravelMinutes,
                  })}
                </AppText>
              </>
            )}
          </View>
        </View>
      </AppCard>
    </View>
  );
}

export type ItineraryTimelineProps = {
  plan: ItineraryPlan;
  assessments?: StopAssessment[];
  showImages?: boolean;
};

export function ItineraryTimeline({
  plan,
  assessments = [],
  showImages = false,
}: ItineraryTimelineProps) {
  return (
    <View accessibilityRole="list" style={styles.timeline}>
      {plan.stops.map((stop, index) => (
        <TimelineStop
          key={stop.id}
          stop={stop}
          assessment={assessments.find((item) => item.stopId === stop.id)}
          showImage={showImages}
          isLast={index === plan.stops.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timeColumn: {
    width: 50,
    paddingTop: spacing[4],
  },
  rail: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    marginTop: spacing[5],
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.neutral.white,
    backgroundColor: colors.brand[500],
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: spacing[6],
    backgroundColor: colors.brand[200],
  },
  stopCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 112,
    backgroundColor: colors.brand[100],
  },
  attribution: {
    position: 'absolute',
    right: spacing[2],
    bottom: 0,
    left: spacing[2],
    alignItems: 'flex-start',
    backgroundColor: colors.neutral.navy,
    borderRadius: radii.xs,
  },
  stopCopy: {
    gap: spacing[2],
    padding: spacing[3],
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[1],
  },
});
