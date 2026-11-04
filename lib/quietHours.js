export const QUIET_FROM_HOUR = 23
export const QUIET_TO_HOUR = 7

export function isValidTimeZone(value) {
  if (typeof value !== 'string' || !value || value.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

function localClock(timeZone, now) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(now))
  const pick = (type) => Number(parts.find((part) => part.type === type)?.value) || 0
  return { hour: pick('hour') % 24, minute: pick('minute'), second: pick('second') }
}

export function msUntilMorning(timeZone, now = Date.now()) {
  if (!isValidTimeZone(timeZone)) return 0
  const { hour, minute, second } = localClock(timeZone, now)
  if (hour >= QUIET_TO_HOUR && hour < QUIET_FROM_HOUR) return 0
  const hoursLeft = hour >= QUIET_FROM_HOUR ? 24 - hour + QUIET_TO_HOUR : QUIET_TO_HOUR - hour
  return ((hoursLeft * 60 - minute) * 60 - second) * 1000
}
