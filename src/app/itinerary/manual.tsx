import { useRouter } from 'expo-router';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ItineraryScreenHeader } from '@/components/itinerary/itinerary-screen-header';
import { SelectionChip } from '@/components/itinerary/selection-chip';
import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  IconButton,
  ScreenContainer,
  SectionHeader,
} from '@/components/ui';
import { colors, iconSizes, spacing, type RouteMode } from '@/constants/theme';
import { useItineraries } from '@/context/itinerary-context';
import { destinations } from '@/data/destinations';
import {
  defaultItineraryStartLocation,
  getTravelMinutes,
} from '@/data/itinerary-scenarios';
import {
  addMinutesToTime,
  getLocalDateInput,
  isIsoDate,
  parseTimeToMinutes,
  validateManualStopSequence,
} from '@/utils/itinerary';

type BuilderStop = {
  localId: string;
  destinationId: string;
  plannedArrival: string;
  visitDuration: string;
};

const routeModes: readonly RouteMode[] = ['fastest', 'safest', 'balanced'];

export default function ManualItineraryScreen() {
  const { t } = useTranslation('itinerary');
  const router = useRouter();
  const { createManualDraft } = useItineraries();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getLocalDateInput());
  const [startTime, setStartTime] = useState('08:00');
  const [routePreference, setRoutePreference] = useState<RouteMode>('balanced');
  const [stops, setStops] = useState<BuilderStop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appendDestination = (destinationId: string) => {
    const previous = stops.at(-1);
    const previousDestinationId = previous?.destinationId ?? defaultItineraryStartLocation.id;
    const baseTime = previous
      ? addMinutesToTime(previous.plannedArrival, Number(previous.visitDuration) || 90)
      : startTime;
    const plannedArrival = addMinutesToTime(
      baseTime,
      getTravelMinutes(previousDestinationId, destinationId),
    );
    setStops((current) => [
      ...current,
      {
        localId: `manual-stop-${Date.now()}-${current.length}`,
        destinationId,
        plannedArrival,
        visitDuration: '90',
      },
    ]);
    setError(null);
  };

  const addDestination = (destinationId: string) => {
    if (stops.some((stop) => stop.destinationId === destinationId)) {
      Alert.alert(t('manual.duplicateTitle'), t('manual.duplicateDescription'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('manual.addAgain'), onPress: () => appendDestination(destinationId) },
      ]);
      return;
    }
    appendDestination(destinationId);
  };

  const updateStop = (localId: string, patch: Partial<BuilderStop>) => {
    setStops((current) =>
      current.map((stop) => (stop.localId === localId ? { ...stop, ...patch } : stop)),
    );
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= stops.length) return;
    setStops((current) => {
      const arrivalSlots = current.map((stop) => stop.plannedArrival);
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next.map((stop, stopIndex) => ({
        ...stop,
        plannedArrival: arrivalSlots[stopIndex],
      }));
    });
  };

  const validationError = useMemo(() => {
    if (!title.trim()) return t('validation.title');
    if (!isIsoDate(date)) return t('validation.date');
    if (parseTimeToMinutes(startTime) === null) return t('validation.time');
    if (stops.length === 0) return t('validation.stop');
    const normalized = stops.map((stop) => ({
      destinationId: stop.destinationId,
      plannedArrival: stop.plannedArrival,
      visitDurationMinutes: Number(stop.visitDuration),
    }));
    if (!validateManualStopSequence(normalized)) return t('validation.sequence');
    const firstArrival = parseTimeToMinutes(normalized[0]?.plannedArrival ?? '');
    const start = parseTimeToMinutes(startTime);
    if (firstArrival === null || start === null || firstArrival < start) {
      return t('validation.arrivalAfterStart');
    }
    return null;
  }, [date, startTime, stops, t, title]);

  const submit = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const itinerary = await createManualDraft({
        title: title.trim(),
        date,
        startLocation: defaultItineraryStartLocation,
        startTime,
        routePreference,
        stops: stops.map((stop) => ({
          destinationId: stop.destinationId,
          plannedArrival: stop.plannedArrival,
          visitDurationMinutes: Number(stop.visitDuration),
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
          title={t('manual.title')}
          subtitle={t('manual.subtitle')}
          backLabel={t('common.back')}
          onBack={() => router.back()}
        />

        <AppCard style={styles.formCard}>
          <AppInput
            label={t('fields.tripName')}
            placeholder={t('manual.namePlaceholder')}
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
            label={t('fields.startLocation')}
            value={defaultItineraryStartLocation.name}
            editable={false}
          />
          <AppInput
            label={t('fields.startTime')}
            placeholder="08:00"
            value={startTime}
            keyboardType="numbers-and-punctuation"
            onChangeText={setStartTime}
          />
        </AppCard>

        <View>
          <SectionHeader title={t('fields.routePreference')} />
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
        </View>

        <View>
          <SectionHeader
            title={t('manual.addDestination')}
            subtitle={t('manual.addDestinationHint')}
          />
          <View style={styles.chips}>
            {destinations.map((destination) => (
              <SelectionChip
                key={destination.id}
                label={destination.name}
                selected={stops.some((stop) => stop.destinationId === destination.id)}
                onPress={() => addDestination(destination.id)}
              />
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title={t('manual.stopsTitle')} />
          <View style={styles.stopList}>
            {stops.length === 0 && (
              <AppCard variant="soft">
                <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                  {t('manual.noStops')}
                </AppText>
              </AppCard>
            )}
            {stops.map((stop, index) => {
              const destination = destinations.find(
                (item) => item.id === stop.destinationId,
              );
              return (
                <AppCard key={stop.localId} variant="outlined" style={styles.stopCard}>
                  <View style={styles.stopHeader}>
                    <View style={styles.stopCopy}>
                      <AppText variant="caption" color={colors.brand[600]}>
                        {t('manual.stopNumber', { count: index + 1 })}
                      </AppText>
                      <AppText variant="headingSm">
                        {destination?.name ?? stop.destinationId}
                      </AppText>
                    </View>
                    <View style={styles.actions}>
                      <IconButton
                        variant="default"
                        disabled={index === 0}
                        accessibilityLabel={t('manual.moveUp')}
                        icon={<ArrowUp size={iconSizes.button} color={colors.brand[700]} />}
                        onPress={() => moveStop(index, -1)}
                      />
                      <IconButton
                        variant="default"
                        disabled={index === stops.length - 1}
                        accessibilityLabel={t('manual.moveDown')}
                        icon={<ArrowDown size={iconSizes.button} color={colors.brand[700]} />}
                        onPress={() => moveStop(index, 1)}
                      />
                      <IconButton
                        variant="danger"
                        accessibilityLabel={t('manual.remove')}
                        icon={<Trash2 size={iconSizes.button} color={colors.semantic.danger.text} />}
                        onPress={() =>
                          setStops((current) =>
                            current.filter((item) => item.localId !== stop.localId),
                          )
                        }
                      />
                    </View>
                  </View>
                  <View style={styles.stopFields}>
                    <AppInput
                      label={t('fields.arrival')}
                      value={stop.plannedArrival}
                      keyboardType="numbers-and-punctuation"
                      onChangeText={(value) =>
                        updateStop(stop.localId, { plannedArrival: value })
                      }
                    />
                    <AppInput
                      label={t('fields.durationMinutes')}
                      value={stop.visitDuration}
                      keyboardType="number-pad"
                      onChangeText={(value) =>
                        updateStop(stop.localId, { visitDuration: value })
                      }
                    />
                  </View>
                </AppCard>
              );
            })}
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
    </KeyboardAvoidingView>
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
  stopList: {
    gap: spacing[3],
  },
  stopCard: {
    gap: spacing[3],
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  stopCopy: {
    flex: 1,
    gap: spacing[1],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stopFields: {
    gap: spacing[3],
  },
});
