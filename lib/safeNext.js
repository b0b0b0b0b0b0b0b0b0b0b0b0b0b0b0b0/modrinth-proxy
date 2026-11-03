const SITE_DOMAIN = 'modrinth.black'

export function safeNext(value) {
  if (typeof value !== 'string') return null
  if (/^https:\/\//i.test(value)) return safeSiblingUrl(value)
  if (!value.startsWith('/')) return null
  if (value.startsWith('//') || value.includes('\\')) return null
  if (/[\u0000- \u007f]/.test(value)) return null
  return value
}

function safeSiblingUrl(value) {
  if (value.length > 2048 || /[\u0000- \u007f\\]/.test(value)) return null
  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
  const host = url.hostname.toLowerCase()
  if (host !== SITE_DOMAIN && !host.endsWith('.' + SITE_DOMAIN)) return null
  return url.toString()
}
