export const SHARED_PALETTE_COOKIE = 'site-palette'
export const SHARED_THEME_COOKIE = 'site-theme'
export const SHARED_SOUNDS_COOKIE = 'site-kitten-sounds'
export const SHARED_CALM_COOKIE = 'site-kitten-calm'

const MAX_AGE = 60 * 60 * 24 * 365

function domainPart() {
  const host = window.location.hostname
  return host === 'modrinth.black' || host.endsWith('.modrinth.black') ? ';domain=.modrinth.black' : ''
}

export function readShared(name) {
  if (typeof document === 'undefined') return null
  return readCookie(name)
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name, value) {
  if (typeof document === 'undefined' || !value) return
  if (readCookie(name) === value) return
  const domain = domainPart()
  if (domain) document.cookie = `${name}=;path=/;max-age=0;samesite=lax`
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${MAX_AGE};samesite=lax${domain}`
}

export function writeSharedPalette(palette) {
  writeCookie(SHARED_PALETTE_COOKIE, palette)
}

export function writeSharedSounds(muted) {
  writeCookie(SHARED_SOUNDS_COOKIE, muted ? 'off' : 'on')
}

export function writeSharedTheme(theme) {
  if (theme !== 'dark' && theme !== 'light' && theme !== 'system') return
  writeCookie(SHARED_THEME_COOKIE, theme)
}
