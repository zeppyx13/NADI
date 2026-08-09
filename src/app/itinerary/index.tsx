import { useRouter } from 'expo-router';
import { MapPinned, Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ItineraryCard } from '@/components/itinerary/itinerary-card';
import { ItineraryScreenHeader } from '@/components/itinerary/itinerary-screen-header';
import {
  AppButton,
  EmptyState,
  LoadingState,
  ScreenContainer,
  SectionHeader,
} from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';
import { useItineraries } from '@/context/itinerary-context';

export default function ItineraryHubScreen() {
  const { t } = useTranslation('itinerary');
  const router = useRouter();
  const { itineraries, isHydrated } = useItineraries();
  const active = itineraries.filter((itinerary) => itinerary.status === 'active');
  const upcoming = itineraries.filter((itinerary) =>
    ['draft', 'suggested', 'approved'].includes(itinerary.status),
  );
  const completed = itineraries.filter((itinerary) => itinerary.status === 'completed');
  const openItinerary = (id: string) =>
    router.push({ pathname: '/itinerary/[id]', params: { id } });

  if (!isHydrated) {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <LoadingState title={t('hub.loading')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scroll
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.screen}
    >
      <ItineraryScreenHeader
        title={t('hub.title')}
        subtitle={t('hub.subtitle')}
        backLabel={t('common.back')}
        onBack={() => router.back()}
      />
      <AppButton
        fullWidth
        label={t('hub.create')}
        leadingIcon={<Plus size={iconSizes.button} color={colors.neutral.white} />}
        onPress={() => router.push('/itinerary/create')}
      />

      {itineraries.length === 0 ? (
        <EmptyState
          icon={<MapPinned size={iconSizes.empty} color={colors.neutral.iconMuted} />}
          title={t('hub.emptyTitle')}
          description={t('hub.emptyDescription')}
          action={{ label: t('hub.emptyAction'), onPress: () => router.push('/itinerary/create') }}
        />
      ) : (
        <>
          {active.length > 0 && (
            <View>
              <SectionHeader title={t('hub.active')} />
              <View style={styles.list}>
                {active.map((itinerary) => (
                  <ItineraryCard
                    key={itinerary.id}
                    itinerary={itinerary}
                    onPress={() => openItinerary(itinerary.id)}
                  />
                ))}
              </View>
            </View>
          )}
          {upcoming.length > 0 && (
            <View>
              <SectionHeader title={t('hub.upcoming')} />
              <View style={styles.list}>
                {upcoming.map((itinerary) => (
                  <ItineraryCard
                    key={itinerary.id}
                    itinerary={itinerary}
                    onPress={() => openItinerary(itinerary.id)}
                  />
                ))}
              </View>
            </View>
          )}
          {completed.length > 0 && (
            <View>
              <SectionHeader title={t('hub.completed')} />
              <View style={styles.list}>
                {completed.map((itinerary) => (
                  <ItineraryCard
                    key={itinerary.id}
                    itinerary={itinerary}
                    onPress={() => openItinerary(itinerary.id)}
                  />
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    gap: spacing[6],
  },
  list: {
    gap: spacing[3],
  },
});
