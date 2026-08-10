import AsyncStorage from '@react-native-async-storage/async-storage';

const recentDestinationStorageKey = 'nadi.recentDestinationIds.v1';
const recentDestinationLimit = 8;

function parseRecentDestinationIds(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is string => typeof item === 'string')
      .slice(0, recentDestinationLimit);
  } catch {
    return [];
  }
}

export async function readRecentDestinationIds(): Promise<string[]> {
  try {
    return parseRecentDestinationIds(
      await AsyncStorage.getItem(recentDestinationStorageKey),
    );
  } catch {
    return [];
  }
}

export async function recordRecentDestinationIds(
  destinationIds: readonly string[],
): Promise<string[]> {
  const current = await readRecentDestinationIds();
  const next = [...new Set([...destinationIds, ...current])].slice(
    0,
    recentDestinationLimit,
  );

  try {
    await AsyncStorage.setItem(recentDestinationStorageKey, JSON.stringify(next));
  } catch {
    // Recent choices are a convenience only; selection must still succeed.
  }

  return next;
}
