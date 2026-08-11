import { useRouter } from 'expo-router';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
} from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CustomMapPointPicker } from '@/components/itinerary/custom-map-point-picker';
import { DestinationPicker } from '@/components/itinerary/destination-picker';
import { ItineraryScreenHeader } from '@/components/itinerary/itinerary-screen-header';
import { NativeDateTimeField } from '@/components/itinerary/native-date-time-field';
import { SelectionChip } from '@/components/itinerary/selection-chip';
import {
  AppButton,
  AppCard,
  AppText,
  ScreenContainer,
  SectionHeader,
} from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  motion,
  radii,
  spacing,
  type RouteMode,
} from '@/constants/theme';
import { useItineraries } from '@/context/itinerary-context';
import { destinations } from '@/data/destinations';
import { defaultItineraryStartLocation } from '@/data/itinerary-scenarios';
import type { Destination, DestinationCategory } from '@/types/destination';
import type {
  BudgetPreference,
  DurationType,
  ItineraryLocation,
  ItineraryPlace,
  TransportPreference,
  TravelCompanion,
  TravelStyle,
} from '@/types/itinerary';
import {
  getLocalDateInput,
  getMaximumItineraryStops,
  getStartOfLocalDay,
} from '@/utils/itinerary';

type PickerTarget = 'start' | 'must-visit' | null;

const durationOptions: readonly DurationType[] = ['half-day', 'one-day'];
const interestOptions: readonly DestinationCategory[] = [
  'beach',
  'culture',
  'nature',
  'culinary',
  'spiritual',
  'village',
];
const travelStyles: readonly TravelStyle[] = ['relaxed', 'balanced', 'intensive'];
const routeModes: readonly RouteMode[] = ['fastest', 'safest', 'balanced'];
const budgetOptions: readonly BudgetPreference[] = ['budget', 'comfortable', 'flexible'];
const transportOptions: readonly TransportPreference[] = [
  'motorcycle',
  'car',
  'driver',
  'public-transport',
];
const companionOptions: readonly TravelCompanion[] = ['solo', 'couple', 'friends', 'family'];

function createInitialJourneyDate() {
  const date = new Date();
  date.setHours(8, 0, 0, 0);
  return date;
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function destinationToLocation(destination: Destination): ItineraryLocation {
  return {
    id: destination.id,
    name: destination.name,
    latitude: destination.latitude,
    longitude: destination.longitude,
    source: 'nadi-destination',
  };
}

export default function TravelPreferencesScreen() {
  const { t, i18n } = useTranslation('itinerary');
  const router = useRouter();
  const { createGeneratedDraft } = useItineraries();
  const [journeyDate, setJourneyDate] = useState(createInitialJourneyDate);
  const [durationType, setDurationType] = useState<DurationType>('one-day');
  const [startLocation, setStartLocation] = useState<ItineraryLocation>(
    defaultItineraryStartLocation,
  );
  const [interests, setInterests] = useState<DestinationCategory[]>(['culture']);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('balanced');
  const [routePreference, setRoutePreference] = useState<RouteMode>('balanced');
  const [mustVisitDestinationIds, setMustVisitDestinationIds] = useState<string[]>([]);
  const [budgetPreference, setBudgetPreference] = useState<BudgetPreference | undefined>(undefined);
  const [transportPreference, setTransportPreference] = useState<TransportPreference | undefined>(undefined);
  const [travelCompanion, setTravelCompanion] = useState<TravelCompanion | undefined>(undefined);
  const [freeformNotes, setFreeformNotes] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [isCustomPointOpen, setIsCustomPointOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (interest: DestinationCategory) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };

  const updateDurationType = (nextDuration: DurationType) => {
    setDurationType(nextDuration);
    setMustVisitDestinationIds((current) =>
      current.slice(0, getMaximumItineraryStops(nextDuration, travelStyle)),
    );
  };

  const updateTravelStyle = (nextStyle: TravelStyle) => {
    setTravelStyle(nextStyle);
    setMustVisitDestinationIds((current) =>
      current.slice(0, getMaximumItineraryStops(durationType, nextStyle)),
    );
  };

  const updateDate = (nextDate: Date) => {
    setJourneyDate((current) => {
      const next = new Date(current);
      next.setFullYear(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
      );
      return next;
    });
  };

  const updateTime = (nextTime: Date) => {
    setJourneyDate((current) => {
      const next = new Date(current);
      next.setHours(nextTime.getHours(), nextTime.getMinutes(), 0, 0);
      return next;
    });
  };

  const submit = async () => {
    if (interests.length === 0) {
      setError(t('validation.interest'));
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const formattedTitleDate = new Intl.DateTimeFormat(
        i18n.language === 'id' ? 'id-ID' : 'en-US',
        { day: 'numeric', month: 'short' },
      ).format(journeyDate);
      const itinerary = await createGeneratedDraft({
        title: t('preferences.autoTitle', { date: formattedTitleDate }),
        date: getLocalDateInput(journeyDate),
        startLocation,
        startTime: formatTime(journeyDate),
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

  const openCustomPointPicker = () => {
    setPickerTarget(null);
    setTimeout(
      () => setIsCustomPointOpen(true),
      Platform.OS === 'ios' ? motion.slow : 0,
    );
  };

  const selectedMustVisitNames = mustVisitDestinationIds.flatMap((id) => {
    const destination = destinations.find((item) => item.id === id);
    return destination ? [destination.name] : [];
  });
  const maximumMustVisit = getMaximumItineraryStops(durationType, travelStyle);

  return (
    <>
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

        <View>
          <SectionHeader title={t('preferences.timeGroup')} />
          <AppCard style={styles.cardContent}>
            <NativeDateTimeField
              label={t('fields.date')}
              value={journeyDate}
              mode="date"
              minimumDate={getStartOfLocalDay()}
              onChange={updateDate}
            />
            <NativeDateTimeField
              label={t('fields.startTime')}
              value={journeyDate}
              mode="time"
              onChange={updateTime}
            />
            <AppText variant="labelMd">{t('preferences.duration')}</AppText>
            <View style={styles.chips}>
              {durationOptions.map((option) => (
                <SelectionChip
                  key={option}
                  label={t(`duration.${option}`)}
                  selected={durationType === option}
                  onPress={() => updateDurationType(option)}
                />
              ))}
            </View>
          </AppCard>
        </View>

        <View>
          <SectionHeader title={t('preferences.startGroup')} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('manual.changeStart')}
            onPress={() => setPickerTarget('start')}
            style={({ pressed }) => [
              styles.locationField,
              pressed && styles.pressed,
            ]}
          >
            <MapPin size={iconSizes.button} color={colors.brand[600]} />
            <View style={styles.flexCopy}>
              <AppText variant="labelLg">{startLocation.name}</AppText>
              {startLocation.source === 'custom-map-point' && (
                <AppText variant="caption" color={colors.neutral.textSecondary}>
                  {t('picker.unavailableIntelligence')}
                </AppText>
              )}
            </View>
          </Pressable>
        </View>

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
              onPress={() => updateTravelStyle(style)}
            />
          ))}
        </PreferenceSection>

        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isAdvancedOpen }}
            onPress={() => setIsAdvancedOpen((current) => !current)}
            style={({ pressed }) => [
              styles.advancedToggle,
              pressed && styles.pressed,
            ]}
          >
            <AppText variant="labelLg" style={styles.flexCopy}>
              {t('preferences.advanced')}
            </AppText>
            {isAdvancedOpen ? (
              <ChevronUp size={iconSizes.button} color={colors.brand[600]} />
            ) : (
              <ChevronDown size={iconSizes.button} color={colors.brand[600]} />
            )}
          </Pressable>
          {isAdvancedOpen && (
            <AppCard variant="outlined" style={styles.advancedContent}>
              <AppText variant="labelMd">{t('fields.routePreference')}</AppText>
              <View style={styles.chips}>
                {routeModes.map((mode) => (
                  <SelectionChip
                    key={mode}
                    label={t(`routeMode.${mode}`)}
                    selected={routePreference === mode}
                    onPress={() => setRoutePreference(mode)}
                  />
                ))}
              </View>

              <AppText variant="labelMd">{t('advancedPreferences.budget')}</AppText>
              <View style={styles.chips}>
                {budgetOptions.map((option) => (
                  <SelectionChip
                    key={option}
                    label={t(`advancedPreferences.budget${option.charAt(0).toUpperCase()}${option.slice(1)}`)}
                    selected={budgetPreference === option}
                    onPress={() => setBudgetPreference(
                      budgetPreference === option ? undefined : option,
                    )}
                  />
                ))}
              </View>

              <AppText variant="labelMd">{t('advancedPreferences.transport')}</AppText>
              <View style={styles.chips}>
                {transportOptions.map((option) => (
                  <SelectionChip
                    key={option}
                    label={t(`advancedPreferences.transport${option === 'motorcycle' ? 'Motorcycle' : option === 'car' ? 'Car' : option === 'driver' ? 'Driver' : 'Public'}`)}
                    selected={transportPreference === option}
                    onPress={() => setTransportPreference(
                      transportPreference === option ? undefined : option,
                    )}
                  />
                ))}
              </View>

              <AppText variant="labelMd">{t('advancedPreferences.companion')}</AppText>
              <View style={styles.chips}>
                {companionOptions.map((option) => (
                  <SelectionChip
                    key={option}
                    label={t(`advancedPreferences.companion${option.charAt(0).toUpperCase()}${option.slice(1)}`)}
                    selected={travelCompanion === option}
                    onPress={() => setTravelCompanion(
                      travelCompanion === option ? undefined : option,
                    )}
                  />
                ))}
              </View>

              <AppText variant="labelMd">{t('preferences.mustVisit')}</AppText>
              {selectedMustVisitNames.length > 0 && (
                <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                  {selectedMustVisitNames.join(' · ')}
                </AppText>
              )}
              <AppButton
                fullWidth
                variant="secondary"
                label={t('preferences.chooseMustVisit')}
                onPress={() => setPickerTarget('must-visit')}
              />

              <AppText variant="labelMd">{t('advancedPreferences.chatPreference')}</AppText>
              <TextInput
                style={styles.freeformInput}
                value={freeformNotes}
                onChangeText={setFreeformNotes}
                placeholder={t('advancedPreferences.chatPreferencePlaceholder')}
                placeholderTextColor={colors.neutral.textMuted}
                multiline
                maxLength={500}
              />
            </AppCard>
          )}
        </View>

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

      <DestinationPicker
        visible={pickerTarget !== null}
        title={
          pickerTarget === 'start' ? t('picker.startTitle') : t('preferences.mustVisit')
        }
        mode={pickerTarget === 'start' ? 'single' : 'multiple'}
        selectedIds={
          pickerTarget === 'start'
            ? startLocation.source === 'nadi-destination' && startLocation.id
              ? [startLocation.id]
              : []
            : mustVisitDestinationIds
        }
        maxSelections={pickerTarget === 'must-visit' ? maximumMustVisit : 1}
        allowCustomPoint={pickerTarget === 'start'}
        onClose={() => setPickerTarget(null)}
        onChooseCustomPoint={openCustomPointPicker}
        onConfirm={(selected) => {
          if (pickerTarget === 'start') {
            const destination = selected[0];
            if (destination) setStartLocation(destinationToLocation(destination));
          } else {
            setMustVisitDestinationIds(selected.map((destination) => destination.id));
          }
          setPickerTarget(null);
        }}
      />
      <CustomMapPointPicker
        visible={isCustomPointOpen}
        title={t('picker.startTitle')}
        onClose={() => setIsCustomPointOpen(false)}
        onConfirm={(place: ItineraryPlace) => {
          setStartLocation(place);
          setIsCustomPointOpen(false);
        }}
      />
    </>
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
  screen: {
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    gap: spacing[6],
  },
  cardContent: {
    gap: spacing[4],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  locationField: {
    minHeight: layout.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.white,
  },
  flexCopy: {
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  advancedToggle: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.white,
  },
  advancedContent: {
    gap: spacing[4],
    marginTop: spacing[2],
  },
  freeformInput: {
    minHeight: 80,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.surfaceSoft,
    color: colors.neutral.textPrimary,
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
