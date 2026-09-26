import { DEFAULT_LOCALE } from './config'
import enCore from './messages/en.json'
import ruCore from './messages/ru.json'
import deCore from './messages/de.json'
import itCore from './messages/it.json'
import frCore from './messages/fr.json'
import esCore from './messages/es.json'
import ptCore from './messages/pt.json'
import plCore from './messages/pl.json'
import zhCore from './messages/zh.json'
import jaCore from './messages/ja.json'
import viCore from './messages/vi.json'
import enPages from './messages/pages-en.json'
import ruPages from './messages/pages-ru.json'
import dePages from './messages/pages-de.json'
import itPages from './messages/pages-it.json'
import frPages from './messages/pages-fr.json'
import esPages from './messages/pages-es.json'
import ptPages from './messages/pages-pt.json'
import plPages from './messages/pages-pl.json'
import zhPages from './messages/pages-zh.json'
import jaPages from './messages/pages-ja.json'
import viPages from './messages/pages-vi.json'
import enCatalog from './messages/catalog-en.json'
import ruCatalog from './messages/catalog-ru.json'
import deCatalog from './messages/catalog-de.json'
import itCatalog from './messages/catalog-it.json'
import frCatalog from './messages/catalog-fr.json'
import esCatalog from './messages/catalog-es.json'
import ptCatalog from './messages/catalog-pt.json'
import plCatalog from './messages/catalog-pl.json'
import zhCatalog from './messages/catalog-zh.json'
import jaCatalog from './messages/catalog-ja.json'
import viCatalog from './messages/catalog-vi.json'

const DICTIONARIES = {
  ru: { ...ruCore, ...ruPages, ...ruCatalog },
  en: { ...enCore, ...enPages, ...enCatalog },
  de: { ...deCore, ...dePages, ...deCatalog },
  it: { ...itCore, ...itPages, ...itCatalog },
  fr: { ...frCore, ...frPages, ...frCatalog },
  es: { ...esCore, ...esPages, ...esCatalog },
  pt: { ...ptCore, ...ptPages, ...ptCatalog },
  pl: { ...plCore, ...plPages, ...plCatalog },
  zh: { ...zhCore, ...zhPages, ...zhCatalog },
  ja: { ...jaCore, ...jaPages, ...jaCatalog },
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
