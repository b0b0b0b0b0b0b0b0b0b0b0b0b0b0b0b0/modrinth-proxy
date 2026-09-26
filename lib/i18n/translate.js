import { DEFAULT_LOCALE } from './config'
import enCore from './messages/en.json'
import ruCore from './messages/ru.json'
import zhCore from './messages/zh.json'
import viCore from './messages/vi.json'
import enPages from './messages/pages-en.json'
import ruPages from './messages/pages-ru.json'
import zhPages from './messages/pages-zh.json'
import viPages from './messages/pages-vi.json'
import enCatalog from './messages/catalog-en.json'
import ruCatalog from './messages/catalog-ru.json'
import zhCatalog from './messages/catalog-zh.json'
import viCatalog from './messages/catalog-vi.json'

const DICTIONARIES = {
  ru: { ...ruCore, ...ruPages, ...ruCatalog },
  en: { ...enCore, ...enPages, ...enCatalog },
  zh: { ...zhCore, ...zhPages, ...zhCatalog },
  vi: { ...viCore, ...viPages, ...viCatalog },
}

export function getDictionary(locale) {
  return DICTIONARIES[locale] || DICTIONARIES.en || DICTIONARIES[DEFAULT_LOCALE]
}

export function lookupMessage(dictionary, key) {
  if (!key) return ''
  return key.split('.').reduce((value, part) => {
    if (value && typeof value === 'object' && part in value) return value[part]
    return undefined
  }, dictionary)
}

export function getMessage(locale, key) {
  const fromLocale = lookupMessage(getDictionary(locale), key)
  if (fromLocale !== undefined) return fromLocale
  return lookupMessage(getDictionary(DEFAULT_LOCALE), key)
}

export function interpolate(template, vars = {}) {
  if (typeof template !== 'string') return template ?? ''
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const value = vars[name]
    return value == null ? '' : String(value)
  })
}

export function translate(locale, key, vars) {
  const fromLocale = lookupMessage(getDictionary(locale), key)
  const fromEn = lookupMessage(getDictionary('en'), key)
  const fromDefault = lookupMessage(getDictionary(DEFAULT_LOCALE), key)
  const template =
    typeof fromLocale === 'string'
      ? fromLocale
      : typeof fromEn === 'string'
        ? fromEn
        : typeof fromDefault === 'string'
          ? fromDefault
          : key
  return interpolate(template, vars)
}
