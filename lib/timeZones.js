const NAME_NOISE = [
  /^час:\s*/i,
  /^за\s+/i,
  /\s*\(Ortszeit\)$/i,
  /\s+Time$/i,
  /^Giờ\s+/i,
  /時間$/,
  /^Heure\s*:\s*/i,
  /^Hora\s+de\s+/i,
  /^Ora\s+(?:di\s+|del\s+|della\s+)?/i,
  /^Horário\s+(?:de\s+|do\s+|da\s+)?/i,
  /^Laika josla:\s*/i,
  /^Czas\s*:\s*/i,
  /\s*\(tid\)$/i,
  /\s*tid$/i,
  /时间$/,
  /,?\s*(?:стандартное|летнее)\s+время$/i,
  /,?\s*(?:стандартний|літній)\s+час$/i,
  /\s+Standard$/i,
  /\s*Normalzeit$/i,
  /\s*標準時$/,
  /^Chuẩn\s+/i,
  /\s*标准时间$/,
  /^Hora\s+(?:estándar|padrão)\s+(?:de\s+|da\s+|do\s+)?/i,
  /^Heure\s+normale\s+(?:de\s+|d’|d')?/i,
]

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

function namePart(zone, locale, style) {
  return (
    new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: style })
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value || ''
  )
}

function cleanName(raw) {
  let name = raw.trim()
  for (const pattern of NAME_NOISE) name = name.replace(pattern, '')
  return name.trim()
}

function isAbbrev(name) {
  return !name || /^(?:GMT|UTC)/.test(name) || /^[A-Z]{1,5}$/.test(name)
}

function fitsScript(name, locale) {
  const lang = locale.toLowerCase()
  if (lang.startsWith('ru') || lang.startsWith('uk')) return /[А-Яа-яЁёІіЇїЄєҐґ]/.test(name)
  if (lang.startsWith('zh') || lang.startsWith('ja')) return /[぀-ヿ㐀-鿿]/.test(name)
  return true
}

function cityFromId(zone) {
  return zone.split('/').pop().replace(/_/g, ' ')
}

export function zonePlaceName(zone, locale) {
  try {
    const name = cleanName(namePart(zone, locale, 'shortGeneric'))
    if (!isAbbrev(name) && fitsScript(name, locale)) return name
    if (fitsScript(cityFromId(zone), locale)) return cityFromId(zone)
    const long = cleanName(namePart(zone, locale, 'longGeneric'))
    if (!isAbbrev(long) && fitsScript(long, locale)) return long
  } catch {}
  return cityFromId(zone)
}

const optionCache = new Map()

export function timeZoneOptions(locale) {
  if (optionCache.has(locale)) return optionCache.get(locale)
  let zones = []
  try {
    zones = Intl.supportedValuesOf('timeZone')
  } catch {}
  const seen = new Map()
  const rows = []
  for (const zone of zones) {
    if (zone === 'UTC' || zone.startsWith('Etc/')) continue
    const offset = zoneOffsetLabel(zone)
    const place = zonePlaceName(zone, locale)
    const key = `${offset}|${place}`
    const row = { value: zone, label: place, hint: offset, search: `${place} ${zone.replace(/_/g, ' ')} ${offset}`, minutes: offsetMinutes(offset) }
    if (seen.has(key)) {
      if (cityFromId(zone) === place) rows[seen.get(key)] = row
      continue
    }
    seen.set(key, rows.length)
    rows.push(row)
  }
  rows.sort((a, b) => a.minutes - b.minutes || a.label.localeCompare(b.label, locale))
  const options = [{ value: 'UTC', label: 'UTC', hint: 'UTC±0', search: 'UTC GMT' }, ...rows.map(({ minutes, ...row }) => row)]
  optionCache.set(locale, options)
  return options
}

export function timeZoneOption(zone, locale) {
  return (
    timeZoneOptions(locale).find((option) => option.value === zone) || {
      value: zone,
      label: zonePlaceName(zone, locale),
      hint: zoneOffsetLabel(zone),
      search: zone,
    }
  )
}
