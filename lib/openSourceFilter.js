function getAllParam(searchParams, key) {
  if (!searchParams) return []
  if (typeof searchParams.getAll === 'function') {
    return searchParams.getAll(key).filter(Boolean)
  }
  const value = searchParams[key]
  if (Array.isArray(value)) return value.filter(Boolean)
  if (value) return [value]
  return []
}

const STORAGE_KEY = 'catalog-open-source-filter'
const STATES = new Set(['selected', 'excluded', 'none'])

export function parseOpenSourceFilter(searchParams) {
  for (const value of getAllParam(searchParams, 'l')) {
    const decoded = decodeURIComponent(String(value))
    if (decoded === 'open_source:true') return 'selected'
    if (decoded === 'open_source:false' || decoded === 'open_source!=true') return 'excluded'
  }
  return 'none'
}

export function excludeOpenSourceParam(pathname = '') {
  const path = String(pathname)
  if (path.includes('plugin') || path.includes('modpack')) return 'open_source!=true'
  return 'open_source:false'
}

export function appendOpenSourceParams(params, state, pathname) {
  if (state === 'selected') params.append('l', 'open_source:true')
  if (state === 'excluded') params.append('l', excludeOpenSourceParam(pathname))
}

export function copyOpenSourceParams(params, searchParams) {
  const seen = new Set()
  for (const value of getAllParam(searchParams, 'l')) {
    const decoded = decodeURIComponent(String(value))
    if (
      decoded !== 'open_source:true' &&
      decoded !== 'open_source:false' &&
      decoded !== 'open_source!=true'
    ) {
      continue
    }
    if (seen.has(decoded)) continue
    seen.add(decoded)
    params.append('l', decoded)
  }
}

export function appendOpenSourceFacets(facets, searchParams) {
  const state = parseOpenSourceFilter(searchParams)
  if (state === 'selected') facets.push(['open_source:true'])
  if (state === 'excluded') facets.push(['open_source:false'])
}

export function loadStoredOpenSource() {
  if (typeof window === 'undefined') return 'none'
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return STATES.has(value) ? value : 'none'
  } catch {
    return 'none'
  }
}

export function saveStoredOpenSource(state) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, STATES.has(state) ? state : 'none')
  } catch {}
}

export function isServersPath(path) {
  return /(?:^|\/)servers(?:\/|$)/.test(String(path || ''))
}
