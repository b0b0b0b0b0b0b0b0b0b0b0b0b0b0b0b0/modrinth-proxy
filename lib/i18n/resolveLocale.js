import { DETECT_FALLBACK_LOCALE, isEnabledLocale } from './config'

const CIS_LANGS = new Set([
  'ru', 'uk', 'be', 'kk', 'ky', 'uz', 'tg', 'tk', 'az', 'hy', 'ka',
  'et', 'lv', 'lt', 'mo', 'ab', 'os', 'tt', 'ba', 'cv', 'ce', 'av',
  'kbd', 'ady', 'udm', 'sah', 'xal', 'tyv', 'chm', 'mdf', 'myv',
  'lez', 'dar', 'lbe', 'inh', 'kum', 'nog', 'crh', 'gag', 'kaa', 'kjh',
])

const CHINESE_LANGS = new Set(['zh', 'yue', 'cmn', 'wuu', 'nan', 'hak', 'gan', 'cdo'])

function parseAcceptLanguage(header) {
  if (!header) return []

  return header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const qParam = params.find((item) => item.trim().startsWith('q='))
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1
      return { tag: tag.trim().toLowerCase().replace('_', '-'), q: Number.isFinite(q) ? q : 0 }
    })
    .filter((item) => item.tag)
    .sort((a, b) => b.q - a.q)
}

function primaryAndRegion(tag) {
  const [primary, region] = tag.split('-')
  return { primary, region }
}

export function localeFromLanguageTag(tag) {
  if (!tag) return null
  const { primary, region } = primaryAndRegion(tag.toLowerCase().replace('_', '-'))

  if (CHINESE_LANGS.has(primary) || primary.startsWith('zh')) return 'zh'
  if (primary === 'vi') return 'vi'
  if (CIS_LANGS.has(primary)) return 'ru'
  if (primary === 'ro' && region === 'md') return 'ru'
  if (primary === 'en') return 'en'

  return null
}

export function detectFromAcceptLanguage(header) {
  for (const { tag, q } of parseAcceptLanguage(header)) {
    if (q <= 0) continue
    const locale = localeFromLanguageTag(tag)
    if (locale && isEnabledLocale(locale)) return locale
  }
  return DETECT_FALLBACK_LOCALE
}

export function resolveLocale(cookieValue, acceptLanguage) {
  if (isEnabledLocale(cookieValue)) return cookieValue
  return detectFromAcceptLanguage(acceptLanguage)
}
