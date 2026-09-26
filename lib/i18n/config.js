export const LOCALE_COOKIE = 'site-locale'
export const DEFAULT_LOCALE = 'ru'
export const DETECT_FALLBACK_LOCALE = 'en'

export const LOCALES = [
  { id: 'ru', nativeName: 'Русский', englishName: 'Russian', short: 'RU', flag: 'ru', enabled: true },
  { id: 'en', nativeName: 'English', englishName: 'English (United States)', short: 'EN', flag: 'us', enabled: true },
  { id: 'zh', nativeName: '简体中文', englishName: 'Chinese (Simplified)', short: 'ZH', flag: 'cn', enabled: true },
  { id: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese', short: 'VI', flag: 'vn', enabled: true },
]

const INTL_TAGS = {
  ru: 'ru-RU',
  en: 'en-US',
  zh: 'zh-CN',
  vi: 'vi-VN',
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
