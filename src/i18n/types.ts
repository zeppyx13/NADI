export type SupportedLanguage = 'id' | 'en';

export const supportedLanguages = [
  {
    code: 'id',
    label: 'Bahasa Indonesia',
    shortLabel: 'ID',
  },
  {
    code: 'en',
    label: 'English',
    shortLabel: 'EN',
  },
] as const satisfies readonly {
  code: SupportedLanguage;
  label: string;
  shortLabel: string;
}[];

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return value === 'id' || value === 'en';
}
