import AsyncStorage from '@react-native-async-storage/async-storage';

import { adaptiveScenarios } from '@/data/adaptive-scenarios';
import type { ItineraryScenarioId } from '@/types/itinerary';

/**
 * Which deterministic scenario the adaptive engine reasons about.
 *
 * This is a demo control, not product state. It is only reachable from the
 * development-only section of the profile screen, and a production build never
 * exposes a way to change it. The itinerary service reads it synchronously,
 * which is why the value is mirrored in memory rather than awaited on each call.
 */
export const DEMO_SCENARIO_STORAGE_KEY = 'nadi.demoScenarioId';

/** Scenario used for a live journey when nothing else has been chosen. */
export const defaultJourneyScenarioId: ItineraryScenarioId = 'route-incident';

let activeScenarioId: ItineraryScenarioId = defaultJourneyScenarioId;

function isScenarioId(value: unknown): value is ItineraryScenarioId {
  return typeof value === 'string' && value in adaptiveScenarios;
}

export function getActiveDemoScenario(): ItineraryScenarioId {
  return activeScenarioId;
}

export async function hydrateDemoScenario(): Promise<ItineraryScenarioId> {
  try {
    const stored = await AsyncStorage.getItem(DEMO_SCENARIO_STORAGE_KEY);
    if (isScenarioId(stored)) activeScenarioId = stored;
  } catch {
    // The default scenario still applies when local storage is unavailable.
  }
  return activeScenarioId;
}

export async function setActiveDemoScenario(
  scenarioId: ItineraryScenarioId,
): Promise<void> {
  activeScenarioId = scenarioId;
  try {
    await AsyncStorage.setItem(DEMO_SCENARIO_STORAGE_KEY, scenarioId);
  } catch {
    // The choice still applies for the current session.
  }
}
