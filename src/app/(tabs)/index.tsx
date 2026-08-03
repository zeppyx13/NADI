import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  MapPin,
  Navigation,
  TriangleAlert,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DestinationCard } from '@/components/destination/destination-card';
import { MainScreenHeader } from '@/components/layout/main-screen-header';
import {
  AppButton,
  AppCard,
  AppText,
  IconButton,
  ScreenContainer,
  SearchField,
  SectionHeader,
} from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import { destinations } from '@/data/destinations';

const recommendationDestinations = destinations.slice(1, 4);

export default function HomeScreen() {
  const { t } = useTranslation('screens');
  const router = useRouter();

  return (
    <ScreenContainer scroll style={styles.screen}>
      <MainScreenHeader
        eyebrow={t('home.location')}
        title={t('home.greeting')}
        rightAction={
          <IconButton
            variant="soft"
            accessibilityLabel={t('home.notificationAccessibility')}
            icon={<Bell size={iconSizes.header} color={colors.brand[700]} />}
            onPress={() => router.push('/(tabs)/alerts')}
          />
        }
      />

      <SearchField
        editable={false}
        placeholder={t('home.searchPlaceholder')}
        accessibilityLabel={t('home.searchAccessibility')}
        onPressIn={() => router.push('/(tabs)/explore')}
      />

      <View>
        <SectionHeader title={t('home.alertSection')} />
        <AppCard
          onPress={() => router.push('/(tabs)/alerts')}
          style={styles.alertCard}
        >
          <View style={styles.alertIcon}>
            <TriangleAlert
              size={iconSizes.header}
              color={colors.semantic.danger.text}
            />
          </View>
          <View style={styles.alertCopy}>
            <AppText variant="labelLg">
              {t('alerts.items.incident.title')}
            </AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              Jl. Teuku Umar, Denpasar
            </AppText>
          </View>
          <ChevronRight size={iconSizes.button} color={colors.neutral.iconMuted} />
        </AppCard>
      </View>

      <View>
        <SectionHeader
          title={t('home.mapSection')}
          subtitle={t('home.mapSubtitle')}
          action={{
            label: t('home.openMap'),
            onPress: () => router.push('/(tabs)/map'),
          }}
        />
        <AppCard style={styles.mapPreview} onPress={() => router.push('/(tabs)/map')}>
          <View style={styles.mapArtwork}>
            <View style={[styles.mapRoad, styles.mapRoadPrimary]} />
            <View style={[styles.mapRoad, styles.mapRoadSecondary]} />
            <View style={styles.mapMarkerPrimary}>
              <Navigation size={iconSizes.button} color={colors.neutral.white} />
            </View>
            <View style={styles.mapMarkerSecondary}>
              <MapPin size={iconSizes.button} color={colors.semantic.warning.text} />
            </View>
          </View>
          <View style={styles.mapSummary}>
            <AppText variant="headingSm">{t('home.mapSummary')}</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('home.mapCaption')}
            </AppText>
          </View>
        </AppCard>
      </View>

      <View>
        <SectionHeader
          title={t('home.recommendations')}
          subtitle={t('home.recommendationsSubtitle')}
          action={{
            label: t('home.viewAll'),
            onPress: () => router.push('/(tabs)/explore'),
          }}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {recommendationDestinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              compact
              destination={destination}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/map',
                  params: { destinationId: destination.id },
                })
              }
            />
          ))}
        </ScrollView>
      </View>

      <AppCard variant="soft" style={styles.quieterCard}>
        <View style={styles.quieterCopy}>
          <AppText variant="headingSm">{t('home.quieter')}</AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t('home.quieterSubtitle')}
          </AppText>
        </View>
        <AppButton
          size="sm"
          variant="secondary"
          label={destinations[3].name}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/map',
              params: { destinationId: destinations[3].id },
            })
          }
        />
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    gap: spacing[6],
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderColor: colors.semantic.danger.bg,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.semantic.danger.bg,
  },
  alertCopy: {
    flex: 1,
    gap: spacing[1],
  },
  mapPreview: {
    padding: 0,
    overflow: 'hidden',
  },
  mapArtwork: {
    height: 144,
    overflow: 'hidden',
    backgroundColor: colors.brand[50],
  },
  mapRoad: {
    position: 'absolute',
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.white,
  },
  mapRoadPrimary: {
    width: '120%',
    top: 60,
    left: -24,
    transform: [{ rotate: '-12deg' }],
  },
  mapRoadSecondary: {
    width: '80%',
    top: 72,
    right: -30,
    transform: [{ rotate: '48deg' }],
  },
  mapMarkerPrimary: {
    position: 'absolute',
    left: '28%',
    top: 44,
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand[600],
  },
  mapMarkerSecondary: {
    position: 'absolute',
    right: '22%',
    bottom: 26,
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.semantic.warning.bg,
  },
  mapSummary: {
    padding: spacing[4],
    gap: spacing[2],
  },
  horizontalList: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  quieterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  quieterCopy: {
    flex: 1,
    gap: spacing[1],
  },
});
