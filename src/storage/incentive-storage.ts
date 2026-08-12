import AsyncStorage from '@react-native-async-storage/async-storage';

import { INCENTIVE_SCHEMA_VERSION } from '@/data/incentive-config';
import { createInitialIncentiveState } from '@/services/incentive-service';
import type { IncentiveState } from '@/types/incentive';

/**
 * Persistence for the incentive domain, kept entirely separate from itinerary
 * storage. A schema change here discards only this key; nothing else is reset.
 */
const INCENTIVE_STATE_KEY = 'nadi.incentiveState';
const LOCAL_USER_ID_KEY = 'nadi.localUserId';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Stable local identity for reward ownership. Auth is still a dummy flow, so
 * the email must not become the ledger key. When a real account backend
 * arrives, this id becomes the migration handle for the existing ledger.
 */
export async function readLocalUserId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_USER_ID_KEY);
    if (stored && stored.length > 0) return stored;
  } catch {
    // Fall through and mint a session-local identity.
  }

  const minted = `local-${Date.now().toString(36)}`;
  try {
    await AsyncStorage.setItem(LOCAL_USER_ID_KEY, minted);
  } catch {
    // The identity still holds for this session.
  }
  return minted;
}

export async function readIncentiveState(): Promise<IncentiveState> {
  const localUserId = await readLocalUserId();

  try {
    const stored = await AsyncStorage.getItem(INCENTIVE_STATE_KEY);
    if (!stored) return createInitialIncentiveState(localUserId);

    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed)) return createInitialIncentiveState(localUserId);
    // An older payload is discarded rather than migrated by guesswork.
    if (parsed.schemaVersion !== INCENTIVE_SCHEMA_VERSION) {
      return createInitialIncentiveState(localUserId);
    }

    const state = parsed as IncentiveState;
    return { ...state, localUserId: state.localUserId || localUserId };
  } catch {
    return createInitialIncentiveState(localUserId);
  }
}

export async function writeIncentiveState(state: IncentiveState): Promise<void> {
  try {
    await AsyncStorage.setItem(INCENTIVE_STATE_KEY, JSON.stringify(state));
  } catch {
    // The award still applies for this session; nothing is committed twice.
  }
}
