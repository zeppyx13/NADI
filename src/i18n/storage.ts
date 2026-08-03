import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import { isSupportedLanguage, type SupportedLanguage } from './types';

export const LANGUAGE_STORAGE_KEY = 'nadi.language';

export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(storedLanguage) ? storedLanguage : null;
  } catch {
    return null;
  }
}

export function getDeviceLanguage(): SupportedLanguage {
  const deviceLanguage = getLocales()[0]?.languageCode;
  return deviceLanguage === 'id' ? 'id' : 'en';
}

export async function storeLanguage(language: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Language still changes for the active session if local storage is unavailable.
  }
}
