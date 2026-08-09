import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ItineraryScreenHeader } from '@/components/itinerary/itinerary-screen-header';
import { SelectionChip } from '@/components/itinerary/selection-chip';
import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  ScreenContainer,
  SectionHeader,
} from '@/components/ui';
import {
  colors,
  iconSizes,
  spacing,
  type RouteMode,
} from '@/constants/theme';
import { useItineraries } from '@/context/itinerary-context';
import { destinations } from '@/data/destinations';
import { defaultItineraryStartLocation } from '@/data/itinerary-scenarios';
import type { DestinationCategory } from '@/types/destination';
import type {
  DurationType,
  ItineraryLocation,
  TravelStyle,
} from '@/types/itinerary';
import { getLocalDateInput, isIsoDate, parseTimeToMinutes } from '@/utils/itinerary';

const durationOptions: readonly DurationType[] = ['half-day', 'one-day'];
const interestOptions: readonly DestinationCategory[] = [
  'beach',
  'culture',
  'nature',
  'spiritual',
  'culinary',
];
const travelStyles: readonly TravelStyle[] = ['relaxed', 'balanced', 'intensive'];
const routeModes: readonly RouteMode[] = ['fastest', 'safest', 'balanced'];

const startLocations: readonly ItineraryLocation[] = [
  defaultItineraryStartLocation,
  ...destinations.map((destination) => ({
    id: destination.id,
    name: destination.name,
    latitude: destination.latitude,
    longitude: destination.longitude,
  })),
];

export default function TravelPreferencesScreen() {
  const { t } = useTranslation('itinerary');
  const router = useRouter();
  const { createGeneratedDraft } = useItineraries();
  const [title, setTitle] = useState(t('preferences.defaultTitle'));
  const [date, setDate] = useState(getLocalDateInput());
  const [durationType, setDurationType] = useState<DurationType>('one-day');
  const [startLocation, setStartLocation] = useState<ItineraryLocation>(
    defaultItineraryStartLocation,
  );
  const [startTime, setStartTime] = useState('08:00');
  const [interests, setInterests] = useState<DestinationCategory[]>(['culture']);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('balanced');
  const [routePreference, setRoutePreference] = useState<RouteMode>('balanced');
  const [mustVisitDestinationIds, setMustVisitDestinationIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationError = useMemo(() => {
    if (!title.trim()) return t('validation.title');
    if (!isIsoDate(date)) return t('validation.date');
    if (parseTimeToMinutes(startTime) === null) return t('validation.time');
    if (interests.length === 0) return t('validation.interest');
    return null;
  }, [date, interests.length, startTime, t, title]);

  const toggleInterest = (interest: DestinationCategory) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };

  const toggleMustVisit = (destinationId: string) => {
    setMustVisitDestinationIds((current) =>
      current.includes(destinationId)
        ? current.filter((item) => item !== destinationId)
        : [...current, destinationId],
    );
  };

  const submit = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const itinerary = await createGeneratedDraft({
        title: title.trim(),
        date,
        startLocation,
        startTime,
        preferences: {
          durationType,
          interests,
          travelStyle,
          routePreference,
          mustVisitDestinationIds,
        },
      });
      router.push({ pathname: '/itinerary/review', params: { id: itinerary.id } });
    } catch {
      setError(t('errors.save'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer
        scroll
        edges={['top', 'left', 'right', 'bottom']}
        style={styles.screen}
      >
        <ItineraryScreenHeader
          title={t('preferences.title')}
          subtitle={t('preferences.subtitle')}
          backLabel={t('common.back')}
          onBack={() => router.back()}
        />

        <AppCard style={styles.formCard}>
          <AppInput
            label={t('fields.tripName')}
            value={title}
            onChangeText={setTitle}
          />
          <AppInput
            label={t('fields.date')}
            placeholder="YYYY-MM-DD"
            value={date}
            autoCapitalize="none"
            onChangeText={setDate}
          />
          <AppInput
            label={t('fields.startTime')}
            placeholder="08:00"
            value={startTime}
            keyboardType="numbers-and-punctuation"
            onChangeText={setStartTime}
          />
        </AppCard>

        <PreferenceSection title={t('preferences.duration')}>
          {durationOptions.map((option) => (
            <SelectionChip
              key={option}
              label={t(`duration.${option}`)}
              selected={durationType === option}
              onPress={() => setDurationType(option)}
            />
          ))}
        </PreferenceSection>

        <PreferenceSection title={t('fields.startLocation')}>
          {startLocations.map((location) => (
            <SelectionChip
              key={location.id ?? location.name}
              label={location.name}
              selected={startLocation.id === location.id}
              onPress={() => setStartLocation(location)}
            />
          ))}
        </PreferenceSection>

        <PreferenceSection
          title={t('preferences.interests')}
          subtitle={t('preferences.interestsHint')}
        >
          {interestOptions.map((interest) => (
            <SelectionChip
              key={interest}
              label={t(`interest.${interest}`)}
              selected={interests.includes(interest)}
              onPress={() => toggleInterest(interest)}
            />
          ))}
        </PreferenceSection>

        <PreferenceSection title={t('preferences.travelStyle')}>
          {travelStyles.map((style) => (
            <SelectionChip
              key={style}
              label={t(`travelStyle.${style}`)}
              selected={travelStyle === style}
              onPress={() => setTravelStyle(style)}
            />
          ))}
        </PreferenceSection>

        <PreferenceSection title={t('fields.routePreference')}>
          {routeModes.map((mode) => (
            <SelectionChip
              key={mode}
              label={t(`routeMode.${mode}`)}
              selected={routePreference === mode}
              onPress={() => setRoutePreference(mode)}
            />
          ))}
        </PreferenceSection>

        <PreferenceSection
          title={t('preferences.mustVisit')}
          subtitle={t('preferences.mustVisitHint')}
        >
          {destinations.map((destination) => (
            <SelectionChip
              key={destination.id}
              label={destination.name}
              selected={mustVisitDestinationIds.includes(destination.id)}
              onPress={() => toggleMustVisit(destination.id)}
            />
          ))}
        </PreferenceSection>

        {error && (
          <AppText variant="bodySm" color={colors.semantic.danger.text}>
            {error}
          </AppText>
        )}
        <AppButton
          fullWidth
          variant="teal"
          loading={isSubmitting}
          label={t('preferences.generate')}
          leadingIcon={<Sparkles size={iconSizes.button} color={colors.neutral.white} />}
          onPress={() => void submit()}
        />
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

function PreferenceSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <SectionHeader title={title} subtitle={subtitle} />
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    gap: spacing[6],
  },
  formCard: {
    gap: spacing[4],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
});
