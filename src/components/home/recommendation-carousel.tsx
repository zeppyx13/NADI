import { FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DestinationCard } from '@/components/destination/destination-card';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/constants/theme';
import type { Destination } from '@/types/destination';
import type { HomeDestinationInsight } from '@/types/home';

export type HomeDestinationItem = {
  destination: Destination;
  insight: HomeDestinationInsight;
};

export type RecommendationCarouselProps = {
  items: readonly HomeDestinationItem[];
  onSeeAll: () => void;
  onSelectDestination: (destinationId: string) => void;
};

export function RecommendationCarousel({
  items,
  onSeeAll,
  onSelectDestination,
}: RecommendationCarouselProps) {
  const { t } = useTranslation('home');

  if (items.length === 0) return null;

  return (
    <>
      <SectionHeader
        title={t('recommendations.title')}
        subtitle={t('recommendations.subtitle')}
        action={{ label: t('recommendations.seeAll'), onPress: onSeeAll }}
      />
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.destination.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <DestinationCard
            compact
            showRecommendationReason
            destination={item.destination}
            predictedOccupancyLevel={item.insight.predictedOccupancyLevel}
            recommendationReason={t(
              `recommendations.reasons.${item.insight.recommendationReason}`,
            )}
            onPress={() => onSelectDestination(item.destination.id)}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
});
