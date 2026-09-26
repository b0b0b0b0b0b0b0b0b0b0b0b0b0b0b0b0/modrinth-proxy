export const SITE_ORIGIN = 'https://modrinth.black'
export const SITE_NAME = 'modrinth.black'

export function siteUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_ORIGIN}${normalized}`
}
