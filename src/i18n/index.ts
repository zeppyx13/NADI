import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { authEn } from './locales/en/auth';
import { commonEn } from './locales/en/common';
import { validationEn } from './locales/en/validation';
import { authId } from './locales/id/auth';
import { commonId } from './locales/id/common';
import { validationId } from './locales/id/validation';
import { getDeviceLanguage, getStoredLanguage, storeLanguage } from './storage';
import type { SupportedLanguage } from './types';

export const resources = {
  id: {
    common: commonId,
    auth: authId,
    validation: validationId,
  },
  en: {
    common: commonEn,
    auth: authEn,
    validation: validationEn,
  },
} as const;

const i18n = createInstance();

const initialization = i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  supportedLngs: ['id', 'en'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

let bootstrapPromise: Promise<SupportedLanguage> | null = null;

export function bootstrapI18n(): Promise<SupportedLanguage> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    await initialization;
    const language = (await getStoredLanguage()) ?? getDeviceLanguage();
    await i18n.changeLanguage(language);
    await storeLanguage(language);
    return language;
  })();

  return bootstrapPromise;
}

export default i18n;
