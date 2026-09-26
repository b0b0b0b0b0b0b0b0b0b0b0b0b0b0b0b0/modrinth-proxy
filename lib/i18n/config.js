export const LOCALE_COOKIE = 'site-locale'
export const DEFAULT_LOCALE = 'ru'
export const DETECT_FALLBACK_LOCALE = 'en'

export const LOCALES = [
  { id: 'ru', nativeName: 'Русский', englishName: 'Russian', short: 'RU', flag: 'ru', enabled: true },
  { id: 'orv', nativeName: 'Русь', englishName: 'Дореволюціонный', short: 'Ѣ', flag: 'ru', flagUrl: '/flags/orv-imperial.svg', enabled: true },
  { id: 'en', nativeName: 'English', englishName: 'English (United States)', short: 'EN', flag: 'us', enabled: true },
  { id: 'de', nativeName: 'Deutsch', englishName: 'German', short: 'DE', flag: 'de', enabled: true },
  { id: 'it', nativeName: 'Italiano', englishName: 'Italian', short: 'IT', flag: 'it', enabled: true },
  { id: 'fr', nativeName: 'Français', englishName: 'French', short: 'FR', flag: 'fr', enabled: true },
  { id: 'es', nativeName: 'Español', englishName: 'Spanish', short: 'ES', flag: 'es', enabled: true },
  { id: 'pt', nativeName: 'Português', englishName: 'Portuguese (Brazil)', short: 'PT', flag: 'br', enabled: true },
  { id: 'pl', nativeName: 'Polski', englishName: 'Polish', short: 'PL', flag: 'pl', enabled: true },
  { id: 'lv', nativeName: 'Latviešu', englishName: 'Latvian', short: 'LV', flag: 'lv', enabled: true },
  { id: 'sv', nativeName: 'Svenska', englishName: 'Swedish', short: 'SV', flag: 'se', enabled: true },
  { id: 'zh', nativeName: '简体中文', englishName: 'Chinese (Simplified)', short: 'ZH', flag: 'cn', enabled: true },
  { id: 'ja', nativeName: '日本語', englishName: 'Japanese', short: 'JA', flag: 'jp', enabled: true },
  { id: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese', short: 'VI', flag: 'vn', enabled: true },
]

const INTL_TAGS = {
  ru: 'ru-RU',
  orv: 'ru-RU',
  en: 'en-US',
  de: 'de-DE',
  it: 'it-IT',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-BR',
  pl: 'pl-PL',
  lv: 'lv-LV',
  sv: 'sv-SE',
  zh: 'zh-CN',
  ja: 'ja-JP',
  vi: 'vi-VN',
}

export function localeFlagSrc(locale) {
  if (locale?.flagUrl) return locale.flagUrl
  return `https://flagcdn.com/${locale?.flag || 'ru'}.svg`
}

export function enabledLocales() {
  return LOCALES.filter((locale) => locale.enabled)
}

export function isEnabledLocale(value) {
  return enabledLocales().some((locale) => locale.id === value)
}

export function getLocaleMeta(id) {
  return LOCALES.find((locale) => locale.id === id) || LOCALES[0]
}

export function intlLocale(locale) {
  return INTL_TAGS[locale] || INTL_TAGS.en
}
