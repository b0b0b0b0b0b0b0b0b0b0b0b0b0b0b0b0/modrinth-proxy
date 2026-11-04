import ZONE_COUNTRIES from './zoneNames/countries.json'

const CITY_LANGS = new Set(['ru', 'en', 'uk', 'de', 'es', 'fr', 'it', 'ja', 'lv', 'pl', 'pt', 'sv', 'vi', 'zh'])
const cityCache = new Map()
const regionNames = new Map()
const optionCache = new Map()

export function zoneOffsetLabel(zone, at = new Date()) {
  try {
    const raw = (
      new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
        .formatToParts(at)
        .find((part) => part.type === 'timeZoneName')?.value || 'GMT'
    ).replace('GMT', 'UTC')
    if (raw === 'UTC') return 'UTC±0'
    const match = raw.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/)
    if (!match) return raw
    const minutes = match[3] && match[3] !== '00' ? `:${match[3]}` : ''
    return `UTC${match[1]}${Number(match[2])}${minutes}`
  } catch {
    return 'UTC'
  }
}

function offsetMinutes(label) {
  const match = label.match(/^UTC([+-])(\d+)(?::(\d+))?$/)
  if (!match) return 0
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] || 0))
}

function cityLang(locale) {
  const lang = String(locale || '').split('-')[0].toLowerCase()
  return CITY_LANGS.has(lang) ? lang : 'en'
}

export async function loadTimeZoneCities(locale) {
  const lang = cityLang(locale)
  if (!cityCache.has(lang)) {
    cityCache.set(
      lang,
      import(`./zoneNames/cities-${lang}.json`).then((module) => module.default || module),
    )
  }
  return cityCache.get(lang)
}

function countryName(code, locale) {
  if (!code) return ''
  try {
    if (!regionNames.has(locale)) regionNames.set(locale, new Intl.DisplayNames([locale], { type: 'region' }))
    const name = regionNames.get(locale).of(code)
    return name && name !== code ? name : ''
  } catch {
    return ''
  }
}

function cityFromId(zone) {
  return zone.split('/').pop().replace(/_/g, ' ')
}

export function timeZoneOption(zone, locale, cities) {
  const city = cities?.[zone] || cityFromId(zone)
  const country = countryName(ZONE_COUNTRIES[zone], locale)
  const label = !country ? city : country.startsWith(city) ? country : `${city}, ${country}`
  const hint = zoneOffsetLabel(zone)
  return { value: zone, label, hint, search: `${label} ${zone.replace(/[/_]/g, ' ')} ${hint}` }
}

export function timeZoneOptions(locale, cities) {
  const key = `${locale}|${cityLang(locale)}`
  if (optionCache.has(key)) return optionCache.get(key)
  let zones = []
  try {
    zones = Intl.supportedValuesOf('timeZone')
  } catch {}
  const rows = zones
    .filter((zone) => zone !== 'UTC' && !zone.startsWith('Etc/'))
    .map((zone) => {
      const option = timeZoneOption(zone, locale, cities)
      return { option, minutes: offsetMinutes(option.hint) }
    })
    .sort((a, b) => a.minutes - b.minutes || a.option.label.localeCompare(b.option.label, locale))
    .map(({ option }) => option)
  const options = [{ value: 'UTC', label: 'UTC', hint: 'UTC±0', search: 'UTC GMT' }, ...rows]
  optionCache.set(key, options)
  return options
}
