import AsyncStorage from '@react-native-async-storage/async-storage';

import { destinations } from '@/data/destinations';
import type {
  Itinerary,
  ItineraryPlan,
  ItineraryPlace,
  ItineraryStop,
  ItineraryStorageState,
} from '@/types/itinerary';

export const itineraryStorageKeys = {
  itineraries: 'nadi.itineraries.v1',
  activeItineraryId: 'nadi.activeItineraryId',
} as const;

let writeQueue: Promise<void> = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasValidPlan(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.stops)) return false;
  return value.stops.every(
    (stop) =>
      isRecord(stop) &&
      typeof stop.id === 'string' &&
      typeof stop.destinationId === 'string' &&
      typeof stop.plannedArrival === 'string' &&
      typeof stop.plannedDeparture === 'string' &&
      typeof stop.visitDurationMinutes === 'number',
  );
}

function isStoredItinerary(value: unknown): value is Itinerary {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.date === 'string' &&
    typeof value.status === 'string' &&
    typeof value.version === 'number' &&
    isRecord(value.startLocation) &&
    isRecord(value.preferences) &&
    hasValidPlan(value.originalPlan) &&
    (value.approvedPlan === null || hasValidPlan(value.approvedPlan)) &&
    Array.isArray(value.changeHistory)
  );
}

function isStoredPlace(value: unknown): value is ItineraryPlace {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    (value.source === 'nadi-destination' || value.source === 'custom-map-point')
  );
}

function migrateStop(stop: ItineraryStop): ItineraryStop | null {
  if (isStoredPlace(stop.place)) return stop;

  const destination = destinations.find((item) => item.id === stop.destinationId);
  if (!destination) return null;

  return {
    ...stop,
    place: {
      id: destination.id,
      name: destination.name,
      latitude: destination.latitude,
      longitude: destination.longitude,
      source: 'nadi-destination',
    },
  };
}

function migratePlan(plan: ItineraryPlan): ItineraryPlan | null {
  const stops = plan.stops.flatMap((stop) => {
    const migrated = migrateStop(stop);
    return migrated ? [migrated] : [];
  });
  if (stops.length !== plan.stops.length) return null;

  return {
    ...plan,
    stops,
  };
}

function migrateItinerary(itinerary: Itinerary): Itinerary | null {
  const originalPlan = migratePlan(itinerary.originalPlan);
  const approvedPlan = itinerary.approvedPlan
    ? migratePlan(itinerary.approvedPlan)
    : null;
  if (!originalPlan || (itinerary.approvedPlan && !approvedPlan)) return null;

  return {
    ...itinerary,
    originalPlan,
    approvedPlan,
    latestAnalysis: itinerary.latestAnalysis
      ? {
          ...itinerary.latestAnalysis,
          recommendations: Array.isArray(itinerary.latestAnalysis.recommendations)
            ? itinerary.latestAnalysis.recommendations.flatMap((recommendation) => {
                if (!hasValidPlan(recommendation.proposedPlan)) return [];
                const proposedPlan = migratePlan(recommendation.proposedPlan);
                return proposedPlan ? [{ ...recommendation, proposedPlan }] : [];
              })
            : [],
        }
      : null,
  };
}

function parseItineraries(serialized: string | null): Itinerary[] {
  if (!serialized) return [];

  try {
    const parsed: unknown = JSON.parse(serialized);
    return Array.isArray(parsed)
      ? parsed.filter(isStoredItinerary).flatMap((itinerary) => {
          const migrated = migrateItinerary(itinerary);
          return migrated ? [migrated] : [];
        })
      : [];
  } catch {
    return [];
  }
}

export async function readItineraryStorage(): Promise<ItineraryStorageState> {
  try {
    const entries = await AsyncStorage.multiGet([
      itineraryStorageKeys.itineraries,
      itineraryStorageKeys.activeItineraryId,
    ]);
    const itineraries = parseItineraries(entries[0]?.[1] ?? null);
    const storedActiveId = entries[1]?.[1] ?? null;
    const activeItineraryId = itineraries.some(
      (itinerary) => itinerary.id === storedActiveId && itinerary.status === 'active',
    )
      ? storedActiveId
      : null;
    return { itineraries, activeItineraryId };
  } catch {
    return { itineraries: [], activeItineraryId: null };
  }
}

export async function writeItineraryStorage(
  state: ItineraryStorageState,
): Promise<void> {
  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    await AsyncStorage.multiSet([
      [itineraryStorageKeys.itineraries, JSON.stringify(state.itineraries)],
      [itineraryStorageKeys.activeItineraryId, state.activeItineraryId ?? ''],
    ]);
  });

  await writeQueue;
}
