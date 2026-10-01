export const BIRTHDAY_FORCE = false
export const BDAY_COOKIES_KEY = 'bdayCookiesEaten'

export function isBirthdaySeason(now = new Date()) {
  if (BIRTHDAY_FORCE) return true
  return now.getMonth() + 1 === 10 && now.getDate() === 12
}

export function readCookieScore() {
  try {
    const n = Number(localStorage.getItem(BDAY_COOKIES_KEY))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

export function writeCookieScore(n) {
  try {
    localStorage.setItem(BDAY_COOKIES_KEY, String(Math.max(0, Math.floor(n))))
  } catch {}
}
