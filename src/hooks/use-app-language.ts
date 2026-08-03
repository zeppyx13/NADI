import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '@/i18n';
import { storeLanguage } from '@/i18n/storage';
import { isSupportedLanguage, type SupportedLanguage } from '@/i18n/types';

export function useAppLanguage() {
  const { i18n: activeI18n } = useTranslation();
  const currentLanguage = isSupportedLanguage(activeI18n.resolvedLanguage)
    ? activeI18n.resolvedLanguage
    : 'en';

  const setLanguage = useCallback(async (language: SupportedLanguage) => {
    if (!isSupportedLanguage(language)) {
      return;
    }

    await i18n.changeLanguage(language);
    await storeLanguage(language);
    await Haptics.selectionAsync().catch(() => undefined);
  }, []);

  return {
    language: currentLanguage,
    setLanguage,
  };
}
