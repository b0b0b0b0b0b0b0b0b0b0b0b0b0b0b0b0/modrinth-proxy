const STORAGE_KEY = 'catalog-return'
const ARM_KEY = 'catalog-return-arm'

const CATALOG_SEGMENT_RE = /\/(?:discover\/)?(mods|plugins|shaders|resourcepacks|datapacks|modpacks|servers)(?:\/|$)/

const CONTENT_TYPES_BY_CATALOG = {
  mods: new Set(['mod', 'mods']),
  plugins: new Set(['plugin', 'plugins']),
  shaders: new Set(['shader', 'shaders']),
  resourcepacks: new Set(['resourcepack', 'resourcepacks']),
  datapacks: new Set(['datapack', 'datapacks']),
  modpacks: new Set(['modpack', 'modpacks']),
  servers: new Set(['server', 'servers']),
}

export function isCatalogPath(pathname) {
  return CATALOG_SEGMENT_RE.test(pathname || '')
}

export function isProjectDetailPath(pathname) {
  return /^\/(?:mod|plugin|shader|resourcepack|datapack|modpack|server)\/[^/]+/.test(pathname || '')
}

export function normalizeCatalogHref(href) {
  if (!href) return ''
  const [path, search = ''] = href.split('?')
  const params = new URLSearchParams(search)
  const query = params.toString()
  return `${path}${query ? `?${query}` : ''}`
}

export function saveCatalogReturn(href, scrollY, slug) {
  if (typeof window === 'undefined' || !href || !slug) return
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        href: normalizeCatalogHref(href),
        scrollY: Math.max(0, scrollY | 0),
        slug,
      }),
    )
  } catch {}
}

export function armCatalogReturn() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(ARM_KEY, '1')
  } catch {}
}

export function consumeCatalogReturnArm() {
  if (typeof window === 'undefined') return false
  try {
    const armed = sessionStorage.getItem(ARM_KEY) === '1'
    sessionStorage.removeItem(ARM_KEY)
    return armed
  } catch {
    return false
  }
}

export function readCatalogReturn() {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.href) return null
    return { ...parsed, href: normalizeCatalogHref(parsed.href) }
  } catch {
    return null
  }
}

export function clearCatalogReturn() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(ARM_KEY)
  } catch {}
}

export function catalogReturnMatchesContent(href, contentType) {
  const match = (href || '').split('?')[0].match(CATALOG_SEGMENT_RE)
  if (!match) return false
  return CONTENT_TYPES_BY_CATALOG[match[1]]?.has(contentType) ?? false
}

export function getCatalogReturnQuery(href) {
  try {
    return new URL(href, 'http://local').searchParams.get('q')?.trim() || ''
  } catch {
    return ''
  }
}

function restoreCatalogReturnScroll(currentHref) {
  const saved = readCatalogReturn()
  const normalized = normalizeCatalogHref(currentHref)
  if (!saved?.href || saved.href !== normalized) return false

  const scrollY = Number(saved.scrollY) || 0
  clearCatalogReturn()

  const scroll = () => window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
  requestAnimationFrame(() => requestAnimationFrame(scroll))
  setTimeout(scroll, 120)
  return true
}

export function syncCatalogReturnOnCatalogPage(currentHref) {
  const saved = readCatalogReturn()
  if (!saved?.href) return

  const normalized = normalizeCatalogHref(currentHref)
  if (saved.href === normalized) {
    restoreCatalogReturnScroll(currentHref)
    return
  }

  clearCatalogReturn()
}
