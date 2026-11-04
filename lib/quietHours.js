export const DAY_MINUTES = 24 * 60
export const QUIET_STEP = 30
export const QUIET_MIN_LENGTH = 60
export const QUIET_MAX_LENGTH = 7 * 60
export const QUIET_DEFAULT_FROM = 23 * 60
export const QUIET_DEFAULT_TO = 6 * 60

export function isValidTimeZone(value) {
  if (typeof value !== 'string' || !value || value.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

export function quietLength(from, to) {
  return (((to - from) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
}

export function isQuietMinute(value) {
  return Number.isInteger(value) && value >= 0 && value < DAY_MINUTES && value % QUIET_STEP === 0
}

export function isValidQuietWindow(from, to) {
  if (!isQuietMinute(from) || !isQuietMinute(to)) return false
  const length = quietLength(from, to)
  return length >= QUIET_MIN_LENGTH && length <= QUIET_MAX_LENGTH
}

export function normalizeQuietWindow(from, to) {
  return isValidQuietWindow(from, to) ? { from, to } : { from: QUIET_DEFAULT_FROM, to: QUIET_DEFAULT_TO }
}

export function localSeconds(timeZone, now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(now))
  const pick = (type) => Number(parts.find((part) => part.type === type)?.value) || 0
  return ((pick('hour') % 24) * 60 + pick('minute')) * 60 + pick('second')
}

export function msUntilQuietEnd(timeZone, from, to, now = Date.now()) {
  if (!isValidTimeZone(timeZone)) return 0
  const window = normalizeQuietWindow(from, to)
  const seconds = localSeconds(timeZone, now)
  const sinceStart = (((seconds - window.from * 60) % (DAY_MINUTES * 60)) + DAY_MINUTES * 60) % (DAY_MINUTES * 60)
  const length = quietLength(window.from, window.to) * 60
  if (sinceStart >= length) return 0
  return (length - sinceStart) * 1000
}
