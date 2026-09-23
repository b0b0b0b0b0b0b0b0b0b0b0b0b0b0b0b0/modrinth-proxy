const PREFIX = 'disclosure_types!='
const STORAGE_KEY = 'catalog-disclosure-exclusions'
const CATALOG_RE = /(?:^|\/)(mods|resourcepacks|datapacks|shaders|modpacks|plugins|servers)(?:\/|$)/
const NO_SOFTWARE_DISCLOSURE = new Set(['resourcepacks', 'shaders', 'datapacks'])
const SOFTWARE_DISCLOSURE_IDS = new Set([
  'system_interactions',
  'telemetry',
  'telemetry_opt_in',
  'telemetry_opt_out',
  'telemetry_always_active',
])

export const DISCLOSURE_EXCLUSION_TREE = [
  {
    id: 'ai_content',
    label: 'ИИ-контент',
    children: [
      { id: 'ai_content_code', label: 'ИИ-код' },
      { id: 'ai_content_assets', label: 'ИИ-ресурсы' },
      { id: 'ai_content_text', label: 'ИИ-текст' },
    ],
  },
  { id: 'ai_functionality', label: 'Генеративный ИИ' },
  { id: 'advertisements', label: 'Реклама' },
  { id: 'epilepsy_triggers', label: 'Триггеры светочувствительности' },
  { id: 'system_interactions', label: 'Внешние системы' },
  {
    id: 'telemetry',
    label: 'Телеметрия',
    children: [
      { id: 'telemetry_opt_in', label: 'По согласию' },
      { id: 'telemetry_opt_out', label: 'С отказом' },
      { id: 'telemetry_always_active', label: 'Всегда активна' },
    ],
  },
  { id: 'paid_features', label: 'Платные функции' },
  { id: 'archived', label: 'В архиве' },
]

const LEAF_IDS = new Set(
  DISCLOSURE_EXCLUSION_TREE.flatMap((item) => [
    item.id,
    ...(item.children?.map((child) => child.id) || []),
  ]),
)

const LABEL_BY_ID = new Map()
DISCLOSURE_EXCLUSION_TREE.forEach((item) => {
  LABEL_BY_ID.set(item.id, item.label)
  item.children?.forEach((child) => LABEL_BY_ID.set(child.id, child.label))
})

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

export function catalogTypeFromPath(path) {
  const match = String(path || '').match(CATALOG_RE)
  return match ? match[1] : ''
}

export function isDisclosureAllowedOnCatalog(id, catalogOrPath) {
  const type = catalogTypeFromPath(catalogOrPath)
  if (type && NO_SOFTWARE_DISCLOSURE.has(type) && SOFTWARE_DISCLOSURE_IDS.has(id)) return false
  return LEAF_IDS.has(id)
}

export function filterDisclosureIdsForCatalog(ids, catalogOrPath) {
  return (ids || []).filter((id) => isDisclosureAllowedOnCatalog(id, catalogOrPath))
}

export function disclosureTreeForCatalog(catalogOrPath) {
  return DISCLOSURE_EXCLUSION_TREE.filter((item) => isDisclosureAllowedOnCatalog(item.id, catalogOrPath))
}

export function parseDisclosureExclusions(searchParams) {
  const ids = []
  for (const value of getAllParam(searchParams, 'a')) {
    const decoded = decodeURIComponent(String(value))
    if (!decoded.startsWith(PREFIX)) continue
    const id = decoded.slice(PREFIX.length)
    if (!LEAF_IDS.has(id) || ids.includes(id)) continue
    ids.push(id)
  }
  return ids
}

export function disclosureExclusionFacets(ids) {
  return ids.map((id) => [`${PREFIX}${id}`])
}

export function appendDisclosureExclusionFacets(facets, searchParams, catalogOrPath) {
  disclosureExclusionFacets(
    filterDisclosureIdsForCatalog(parseDisclosureExclusions(searchParams), catalogOrPath),
  ).forEach((group) => {
    facets.push(group)
  })
}

export function appendDisclosureExclusionParams(params, source, catalogOrPath) {
  const ids = filterDisclosureIdsForCatalog(
    Array.isArray(source) ? source : parseDisclosureExclusions(source),
    catalogOrPath,
  )
  ids.forEach((id) => params.append('a', `${PREFIX}${id}`))
}

export function catalogResetUrl(path, extra = {}) {
  const params = new URLSearchParams()
  if (extra.sort) params.set('sort', extra.sort)
  if (extra.sst) params.set('sst', extra.sst)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export function withDisclosureExclusionQuery(href, searchParams) {
  const path = String(href || '').split('?')[0]
  const ids = filterDisclosureIdsForCatalog(parseDisclosureExclusions(searchParams), path)
  if (!ids.length) return href
  const params = new URLSearchParams()
  appendDisclosureExclusionParams(params, ids, path)
  return `${path}?${params.toString()}`
}

export function appendDisclosureExclusionNewFilters(parts, searchParams, catalogOrPath) {
  filterDisclosureIdsForCatalog(parseDisclosureExclusions(searchParams), catalogOrPath).forEach((id) => {
    parts.push(`NOT disclosure_types = "${id}"`)
  })
}

export const EPILEPSY_EXCLUSION_ID = 'epilepsy_triggers'
const EPILEPSY_WARNING_KEY = 'catalog-epilepsy-exclusion-warning-hidden'
const EPILEPSY_ACK_KEY = 'catalog-epilepsy-exclusion-ack'

export function isEpilepsyExclusionWarningHidden() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(EPILEPSY_WARNING_KEY) === '1'
  } catch {
    return false
  }
}

export function hideEpilepsyExclusionWarning() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(EPILEPSY_WARNING_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function isEpilepsyExclusionAcked() {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(EPILEPSY_ACK_KEY) === '1'
  } catch {
    return false
  }
}

export function ackEpilepsyExclusion() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(EPILEPSY_ACK_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearEpilepsyExclusionAck() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(EPILEPSY_ACK_KEY)
  } catch {
    /* ignore */
  }
}

export function shouldSkipEpilepsyWarning() {
  return isEpilepsyExclusionWarningHidden() || isEpilepsyExclusionAcked()
}

export function getDisclosureExclusionLabel(id) {
  return LABEL_BY_ID.get(id) || id
}

export function loadStoredDisclosureExclusions() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(parsed)) return parsed.filter((id) => LEAF_IDS.has(id))
    if (parsed && typeof parsed === 'object') {
      return [...new Set(Object.values(parsed).flat())].filter((id) => LEAF_IDS.has(id))
    }
    return []
  } catch {
    return []
  }
}

export function sameDisclosureExclusionIds(a, b) {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((id) => set.has(id))
}

export function saveStoredDisclosureExclusions(ids) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.filter((id) => LEAF_IDS.has(id))))
    window.dispatchEvent(new Event('catalog-disclosure-exclusions-changed'))
  } catch {
    /* ignore quota */
  }
}

export function saveVisibleDisclosureExclusions(visibleIds, catalogOrPath) {
  const kept = loadStoredDisclosureExclusions().filter((id) => !isDisclosureAllowedOnCatalog(id, catalogOrPath))
  saveStoredDisclosureExclusions([
    ...kept,
    ...filterDisclosureIdsForCatalog(visibleIds, catalogOrPath),
  ])
}

export function disclosureIdsForCatalogHref(searchParams, destPath) {
  const urlIds = parseDisclosureExclusions(searchParams)
  const stored = loadStoredDisclosureExclusions()
  return filterDisclosureIdsForCatalog([...new Set([...stored, ...urlIds])], destPath)
}

export function toggleDisclosureExclusion(selected, id) {
  const current = new Set(selected)
  const group = DISCLOSURE_EXCLUSION_TREE.find((item) => item.id === id || item.children?.some((child) => child.id === id))
  const childIds = group?.children?.map((child) => child.id) || []

  if (group && childIds.length) {
    if (id === group.id) {
      if (current.has(group.id)) {
        current.delete(group.id)
      } else {
        childIds.forEach((child) => current.delete(child))
        current.add(group.id)
      }
      return [...current]
    }

    current.delete(group.id)
    if (current.has(id)) current.delete(id)
    else current.add(id)
    return [...current]
  }

  if (current.has(id)) current.delete(id)
  else current.add(id)
  return [...current]
}
