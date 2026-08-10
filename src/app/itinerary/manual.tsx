import { useRouter } from 'expo-router';
import {
  ArrowDown,
  ArrowUp,
  Clock3,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CustomMapPointPicker } from '@/components/itinerary/custom-map-point-picker';
import { DestinationPicker } from '@/components/itinerary/destination-picker';
import { ItineraryScreenHeader } from '@/components/itinerary/itinerary-screen-header';
import { NativeDateTimeField } from '@/components/itinerary/native-date-time-field';
import {
  AppButton,
  AppCard,
  AppText,
  IconButton,
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
} from '@/constants/theme';
import { useItineraries } from '@/context/itinerary-context';
import {
  defaultItineraryStartLocation,
  getTravelMinutesBetween,
} from '@/data/itinerary-scenarios';
import type { Destination } from '@/types/destination';
import type { ItineraryLocation, ItineraryPlace } from '@/types/itinerary';
import {
  addMinutesToTime,
  getLocalDateInput,
  getStartOfLocalDay,
} from '@/utils/itinerary';

type BuilderStop = {
  localId: string;
  place: ItineraryPlace;
  visitDurationMinutes: number;
};

type PickerTarget = 'start' | 'destinations' | null;
type CustomPointTarget = 'start' | 'destination' | null;

const durationOptions = [60, 90, 120] as const;

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

function destinationToPlace(destination: Destination): ItineraryPlace {
  return {
    id: destination.id,
    name: destination.name,
    latitude: destination.latitude,
    longitude: destination.longitude,
    source: 'nadi-destination',
  };
}

function placeToLocation(place: ItineraryPlace): ItineraryLocation {
  return { ...place };
}

export default function ManualItineraryScreen() {
  const { t, i18n } = useTranslation('itinerary');
  const router = useRouter();
  const { createManualDraft } = useItineraries();
  const [journeyDate, setJourneyDate] = useState(createInitialJourneyDate);
  const [startLocation, setStartLocation] = useState<ItineraryLocation>(
    defaultItineraryStartLocation,
  );
  const [stops, setStops] = useState<BuilderStop[]>([]);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [customPointTarget, setCustomPointTarget] =
    useState<CustomPointTarget>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startTime = formatTime(journeyDate);
  const scheduledStops = useMemo(
    () =>
      stops.reduce<{
        items: (BuilderStop & { plannedArrival: string })[];
        previousLocation: ItineraryLocation;
        cursor: string;
      }>(
        (schedule, stop) => {
          const plannedArrival = addMinutesToTime(
            schedule.cursor,
            getTravelMinutesBetween(schedule.previousLocation, stop.place),
          );
          return {
            items: [...schedule.items, { ...stop, plannedArrival }],
            previousLocation: stop.place,
            cursor: addMinutesToTime(plannedArrival, stop.visitDurationMinutes),
          };
        },
        {
          items: [],
          previousLocation: startLocation,
          cursor: startTime,
        },
      ).items,
    [startLocation, startTime, stops],
  );

  const selectedDestinationIds = stops
    .filter((stop) => stop.place.source === 'nadi-destination')
    .map((stop) => stop.place.id);

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

  const replaceCatalogDestinations = (selected: Destination[]) => {
    const selectedById = new Map(
      selected.map((destination) => [destination.id, destination]),
    );
    const retainedStops = stops.flatMap((stop) => {
      if (stop.place.source === 'custom-map-point') return [stop];
      if (!selectedById.has(stop.place.id)) return [];
      selectedById.delete(stop.place.id);
      return [stop];
    });
    const additions = selected.flatMap((destination, index): BuilderStop[] =>
      selectedById.has(destination.id)
        ? [
            {
              localId: `manual-stop-${destination.id}-${stops.length + index}`,
              place: destinationToPlace(destination),
              visitDurationMinutes: 90,
            },
          ]
        : [],
    );
    setStops([...retainedStops, ...additions]);
    setPickerTarget(null);
    setError(null);
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= stops.length) return;
    setStops((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const cycleDuration = (localId: string) => {
    setStops((current) =>
      current.map((stop) => {
        if (stop.localId !== localId) return stop;
        const index = durationOptions.indexOf(
          stop.visitDurationMinutes as (typeof durationOptions)[number],
        );
        return {
          ...stop,
          visitDurationMinutes:
            durationOptions[(index + 1) % durationOptions.length],
        };
      }),
    );
  };

  const handleCustomPoint = (place: ItineraryPlace) => {
    if (customPointTarget === 'start') {
      setStartLocation(placeToLocation(place));
    } else {
      setStops((current) => [
        ...current,
        {
          localId: `${place.id}-${current.length}`,
          place,
          visitDurationMinutes: 90,
        },
      ]);
    }
    setCustomPointTarget(null);
    setError(null);
  };

  const openCustomPointPicker = () => {
    const target = pickerTarget === 'start' ? 'start' : 'destination';
    setPickerTarget(null);
    setTimeout(
      () => setCustomPointTarget(target),
      Platform.OS === 'ios' ? motion.slow : 0,
    );
  };

  const submit = async () => {
    if (scheduledStops.length === 0) {
      setError(t('validation.stop'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const formattedTitleDate = new Intl.DateTimeFormat(
        i18n.language === 'id' ? 'id-ID' : 'en-US',
        { day: 'numeric', month: 'short' },
      ).format(journeyDate);
      const itinerary = await createManualDraft({
        title: t('manual.autoTitle', { date: formattedTitleDate }),
        date: getLocalDateInput(journeyDate),
        startLocation,
        startTime,
        routePreference: 'balanced',
        stops: scheduledStops.map((stop) => ({
          destinationId: stop.place.id,
          place: stop.place,
          plannedArrival: stop.plannedArrival,
          visitDurationMinutes: stop.visitDurationMinutes,
        })),
      });
      router.push({ pathname: '/itinerary/review', params: { id: itinerary.id } });
    } catch {
      setError(t('errors.save'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ScreenContainer
        scroll
        edges={['top', 'left', 'right', 'bottom']}
        style={styles.screen}
      >
        <ItineraryScreenHeader
          title={t('manual.title')}
          subtitle={t('manual.subtitle')}
          backLabel={t('common.back')}
          onBack={() => router.back()}
        />

        <AppCard style={styles.formCard}>
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
          <AppText variant="labelMd">{t('fields.startLocation')}</AppText>
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
        </AppCard>

        <View>
          <SectionHeader
            title={t('manual.stopsTitle')}
            subtitle={t('manual.addDestinationHint')}
            action={{
              label: t('manual.addDestination'),
              onPress: () => setPickerTarget('destinations'),
            }}
          />
          <View style={styles.stopList}>
            {scheduledStops.length === 0 && (
              <AppCard variant="soft">
                <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                  {t('manual.noStops')}
                </AppText>
              </AppCard>
            )}
            {scheduledStops.map((stop, index) => (
              <View key={stop.localId} style={styles.timelineRow}>
                <View style={styles.timeColumn}>
                  <AppText variant="labelMd" color={colors.brand[700]}>
                    {stop.plannedArrival}
                  </AppText>
                  {index < scheduledStops.length - 1 && <View style={styles.line} />}
                </View>
                <AppCard variant="outlined" style={styles.stopCard}>
                  <View style={styles.stopHeader}>
                    <View style={styles.flexCopy}>
                      <AppText variant="caption" color={colors.brand[600]}>
                        {t('manual.stopNumber', { count: index + 1 })}
                      </AppText>
                      <AppText variant="headingSm">{stop.place.name}</AppText>
                    </View>
                    <View style={styles.actions}>
                      <IconButton
                        disabled={index === 0}
                        accessibilityLabel={t('manual.moveUp')}
                        icon={<ArrowUp size={iconSizes.inline} color={colors.brand[700]} />}
                        onPress={() => moveStop(index, -1)}
                      />
                      <IconButton
                        disabled={index === scheduledStops.length - 1}
                        accessibilityLabel={t('manual.moveDown')}
                        icon={<ArrowDown size={iconSizes.inline} color={colors.brand[700]} />}
                        onPress={() => moveStop(index, 1)}
                      />
                      <IconButton
                        variant="danger"
                        accessibilityLabel={t('manual.remove')}
                        icon={<Trash2 size={iconSizes.inline} color={colors.semantic.danger.text} />}
                        onPress={() =>
                          setStops((current) =>
                            current.filter((item) => item.localId !== stop.localId),
                          )
                        }
                      />
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('manual.durationAction', {
                      minutes: stop.visitDurationMinutes,
                    })}
                    onPress={() => cycleDuration(stop.localId)}
                    style={({ pressed }) => [
                      styles.durationButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Clock3 size={iconSizes.inline} color={colors.brand[600]} />
                    <AppText variant="caption" color={colors.brand[700]}>
                      {t('timeline.visitDuration', {
                        minutes: stop.visitDurationMinutes,
                      })}
                    </AppText>
                  </Pressable>
                </AppCard>
              </View>
            ))}
          </View>
        </View>

        {error && (
          <AppText variant="bodySm" color={colors.semantic.danger.text}>
            {error}
          </AppText>
        )}
        <AppButton
          fullWidth
          loading={isSubmitting}
          label={t('manual.analyze')}
          leadingIcon={<Plus size={iconSizes.button} color={colors.neutral.white} />}
          onPress={() => void submit()}
        />
      </ScreenContainer>

      <DestinationPicker
        visible={pickerTarget !== null}
        title={
          pickerTarget === 'start' ? t('picker.startTitle') : t('picker.title')
        }
        mode={pickerTarget === 'start' ? 'single' : 'multiple'}
        selectedIds={
          pickerTarget === 'start'
            ? startLocation.source === 'nadi-destination' && startLocation.id
              ? [startLocation.id]
              : []
            : selectedDestinationIds
        }
        maxSelections={pickerTarget === 'destinations' ? 8 : 1}
        allowCustomPoint
        onClose={() => setPickerTarget(null)}
        onChooseCustomPoint={openCustomPointPicker}
        onConfirm={(selected) => {
          if (pickerTarget === 'start') {
            const destination = selected[0];
            if (destination) {
              setStartLocation(placeToLocation(destinationToPlace(destination)));
            }
            setPickerTarget(null);
            return;
          }
          replaceCatalogDestinations(selected);
        }}
      />
      <CustomMapPointPicker
        visible={customPointTarget !== null}
        title={
          customPointTarget === 'start'
            ? t('picker.startTitle')
            : t('customPoint.title')
        }
        onClose={() => setCustomPointTarget(null)}
        onConfirm={handleCustomPoint}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    gap: spacing[6],
  },
  formCard: {
    gap: spacing[4],
  },
  locationField: {
    minHeight: layout.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.white,
  },
  pressed: {
    opacity: 0.72,
  },
  flexCopy: {
    flex: 1,
    gap: spacing[1],
  },
  stopList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timeColumn: {
    width: 58,
    alignItems: 'flex-start',
    paddingTop: spacing[4],
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: spacing[4],
    marginTop: spacing[2],
    marginLeft: spacing[4],
    backgroundColor: colors.brand[200],
  },
  stopCard: {
    flex: 1,
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationButton: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.pill,
    backgroundColor: colors.brand[50],
  },
});
