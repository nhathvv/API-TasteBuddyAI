/**
 * Language Constants
 *
 * Available languages for the app with currency and locale information
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  currency: {
    code: string; // ISO 4217 currency code
    symbol: string;
    name: string;
    exchangeRateToVND: number; // Base rate: VND
  };
  locale: string; // BCP 47 locale identifier
  dateFormat: string;
}

export const LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    currency: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      exchangeRateToVND: 25000, // 1 USD = 25,000 VND (approximate)
    },
    locale: 'en-US',
    dateFormat: 'MM/DD/YYYY',
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    currency: {
      code: 'VND',
      symbol: '₫',
      name: 'Vietnamese Dong',
      exchangeRateToVND: 1, // Base currency
    },
    locale: 'vi-VN',
    dateFormat: 'DD/MM/YYYY',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    currency: {
      code: 'KRW',
      symbol: '₩',
      name: 'South Korean Won',
      exchangeRateToVND: 19, // 1 KRW = 19 VND (approximate)
    },
    locale: 'ko-KR',
    dateFormat: 'YYYY/MM/DD',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    currency: {
      code: 'JPY',
      symbol: '¥',
      name: 'Japanese Yen',
      exchangeRateToVND: 167, // 1 JPY = 167 VND (approximate)
    },
    locale: 'ja-JP',
    dateFormat: 'YYYY/MM/DD',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    currency: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      exchangeRateToVND: 27000, // 1 EUR = 27,000 VND (approximate)
    },
    locale: 'de-DE',
    dateFormat: 'DD.MM.YYYY',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    currency: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      exchangeRateToVND: 27000, // 1 EUR = 27,000 VND (approximate)
    },
    locale: 'fr-FR',
    dateFormat: 'DD/MM/YYYY',
  },
];

/**
 * Get language by code
 */
export function getLanguage(code: string): Language | undefined {
  return LANGUAGES.find((lang) => lang.code === code);
}

/**
 * Get default language (Vietnamese)
 */
export function getDefaultLanguage(): Language {
  return LANGUAGES.find((lang) => lang.code === 'vi')!;
}

/**
 * Check if language code is supported
 */
export function isSupportedLanguage(code: string): boolean {
  return LANGUAGES.some((lang) => lang.code === code);
}

/**
 * Get supported language codes
 */
export function getSupportedLanguageCodes(): string[] {
  return LANGUAGES.map((lang) => lang.code);
}
