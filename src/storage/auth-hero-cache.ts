import AsyncStorage from '@react-native-async-storage/async-storage';

import { isUnsplashPhoto, type UnsplashPhoto } from '@/types/unsplash';

export const AUTH_HERO_CACHE_KEY = 'nadi.authHeroPhoto';
export const AUTH_HERO_CACHE_TIME_KEY = 'nadi.authHeroPhoto.cachedAt';
export const AUTH_HERO_CACHE_TTL_MS = 6 * 60 * 60 * 1_000;

export type CachedAuthHeroPhoto = {
  photo: UnsplashPhoto;
  cachedAt: number;
};

export function isAuthHeroCacheFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < AUTH_HERO_CACHE_TTL_MS;
}

export async function readCachedAuthHeroPhoto(): Promise<CachedAuthHeroPhoto | null> {
  try {
    const entries = await AsyncStorage.multiGet([
      AUTH_HERO_CACHE_KEY,
      AUTH_HERO_CACHE_TIME_KEY,
    ]);
    const serializedPhoto = entries[0]?.[1];
    const serializedTime = entries[1]?.[1];

    if (!serializedPhoto || !serializedTime) {
      return null;
    }

    const photo: unknown = JSON.parse(serializedPhoto);
    const cachedAt = Number(serializedTime);

    if (!isUnsplashPhoto(photo) || !Number.isFinite(cachedAt)) {
      return null;
    }

    return { photo, cachedAt };
  } catch {
    return null;
  }
}

export async function writeCachedAuthHeroPhoto(photo: UnsplashPhoto): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [AUTH_HERO_CACHE_KEY, JSON.stringify(photo)],
      [AUTH_HERO_CACHE_TIME_KEY, String(Date.now())],
    ]);
  } catch {
    // The current photo remains usable even when persistent storage is unavailable.
  }
}
