export const SHARED_LOCALE_COOKIE = 'site-locale'

const MAX_AGE = 60 * 60 * 24 * 365

function domainPart() {
  const host = window.location.hostname
  return host === 'modrinth.black' || host.endsWith('.modrinth.black') ? ';domain=.modrinth.black' : ''
}

export function readSharedLocale() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)site-locale=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function writeSharedLocale(locale) {
  if (typeof document === 'undefined') return
  const domain = domainPart()
  if (domain) document.cookie = `${SHARED_LOCALE_COOKIE}=;path=/;max-age=0;samesite=lax`
  document.cookie = `${SHARED_LOCALE_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=${MAX_AGE};samesite=lax${domain}`
}

export function clearSharedLocale() {
  if (typeof document === 'undefined') return
  document.cookie = `${SHARED_LOCALE_COOKIE}=;path=/;max-age=0;samesite=lax`
  const domain = domainPart()
  if (domain) document.cookie = `${SHARED_LOCALE_COOKIE}=;path=/;max-age=0;samesite=lax${domain}`
}
