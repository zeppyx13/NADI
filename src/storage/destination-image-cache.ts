import AsyncStorage from '@react-native-async-storage/async-storage';

import { isUnsplashPhoto, type UnsplashPhoto } from '@/types/unsplash';

const DESTINATION_IMAGE_CACHE_KEY = 'nadi.destinationPhotos';
export const DESTINATION_IMAGE_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

export type CachedDestinationPhoto = {
  photo: UnsplashPhoto;
  cachedAt: number;
};

type DestinationPhotoCache = Record<string, CachedDestinationPhoto>;

let writeQueue: Promise<void> = Promise.resolve();

function isCachedDestinationPhoto(value: unknown): value is CachedDestinationPhoto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return isUnsplashPhoto(candidate.photo) && Number.isFinite(candidate.cachedAt);
}

function parseCache(serialized: string | null): DestinationPhotoCache {
  if (!serialized) return {};

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, CachedDestinationPhoto] =>
        isCachedDestinationPhoto(entry[1]),
      ),
    );
  } catch {
    return {};
  }
}

export function isDestinationPhotoCacheFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < DESTINATION_IMAGE_CACHE_TTL_MS;
}

export async function readCachedDestinationPhoto(
  destinationId: string,
): Promise<CachedDestinationPhoto | null> {
  try {
    const serialized = await AsyncStorage.getItem(DESTINATION_IMAGE_CACHE_KEY);
    return parseCache(serialized)[destinationId] ?? null;
  } catch {
    return null;
  }
}

export async function writeCachedDestinationPhoto(
  destinationId: string,
  photo: UnsplashPhoto,
): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    try {
      const serialized = await AsyncStorage.getItem(DESTINATION_IMAGE_CACHE_KEY);
      const cache = parseCache(serialized);
      cache[destinationId] = { photo, cachedAt: Date.now() };
      await AsyncStorage.setItem(DESTINATION_IMAGE_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // expo-image still keeps its own memory/disk cache if metadata persistence fails.
    }
  });

  await writeQueue;
}

export async function removeCachedDestinationPhoto(
  destinationId: string,
): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    try {
      const serialized = await AsyncStorage.getItem(DESTINATION_IMAGE_CACHE_KEY);
      const cache = parseCache(serialized);
      delete cache[destinationId];
      await AsyncStorage.setItem(DESTINATION_IMAGE_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // A failed image is still removed from the in-memory cache by the hook.
    }
  });

  await writeQueue;
}
