import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Itinerary, ItineraryStorageState } from '@/types/itinerary';

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

function parseItineraries(serialized: string | null): Itinerary[] {
  if (!serialized) return [];

  try {
    const parsed: unknown = JSON.parse(serialized);
    return Array.isArray(parsed) ? parsed.filter(isStoredItinerary) : [];
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
