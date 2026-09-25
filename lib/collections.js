import { cache } from 'react'
import { HIDDEN_COLLECTION_IDS, isCollectionHidden } from './hiddenCollectionBlocks'
import {
  MODRINTH_API,
  MODRINTH_SERVER_API,
  modrinthRequestHeaders,
  MODRINTH_FETCH_TIMEOUT_MS,
  normalizeProject,
} from './modrinth'
import { filterAvatar, replaceBlockedWords } from './contentFilter'

export { HIDDEN_COLLECTION_IDS, isCollectionHidden }

const PROJECT_CHUNK = 100
export const COLLECTION_PAGE_SIZE = 20

function modrinthGet(url, revalidate) {
  return fetch(url, {
    headers: modrinthRequestHeaders(),
    signal: AbortSignal.timeout(MODRINTH_FETCH_TIMEOUT_MS),
    next: { revalidate },
  })
}

export function sanitizeCollection(collection) {
  if (!collection?.id || isCollectionHidden(collection.id)) return null
  return {
    ...collection,
    name: replaceBlockedWords(collection.name || ''),
    description: replaceBlockedWords(collection.description || ''),
    icon_url: filterAvatar(collection.icon_url || collection.raw_icon_url || null),
    projects: Array.isArray(collection.projects) ? collection.projects.filter(Boolean) : [],
  }
}

export const FEATURED_COLLECTIONS_USER = 'Modrinth'

export function isCollectionListed(collection) {
  return collection?.status === 'listed'
}

export const getCollection = cache(async (id) => {
  if (!id || isCollectionHidden(id)) return null
  try {
    const response = await modrinthGet(
      `${MODRINTH_SERVER_API}/collection/${encodeURIComponent(id)}`,
      3600,
    )
    if (!response.ok) return null
    return sanitizeCollection(await response.json())
  } catch {
    return null
  }
})

export const getUserCollections = cache(async (userId) => {
  if (!userId) return []
  try {
    const response = await modrinthGet(
      `${MODRINTH_SERVER_API}/user/${encodeURIComponent(userId)}/collections`,
      3600,
    )
    if (!response.ok) return []
    const data = await response.json()
    if (!Array.isArray(data)) return []
    return data
      .map(sanitizeCollection)
      .filter(Boolean)
      .filter(isCollectionListed)
      .sort((a, b) => String(b.updated || '').localeCompare(String(a.updated || '')))
  } catch {
    return []
  }
})

export async function getProjectsByIds(ids) {
  const unique = [...new Set((ids || []).map(String).filter(Boolean))]
  if (unique.length === 0) return []

  const byId = new Map()
  for (let offset = 0; offset < unique.length; offset += PROJECT_CHUNK) {
    const chunk = unique.slice(offset, offset + PROJECT_CHUNK)
    try {
      const url = `${MODRINTH_API}/projects?ids=${encodeURIComponent(JSON.stringify(chunk))}`
      const response = await modrinthGet(url, 3600)
      if (!response.ok) continue
      const payload = await response.json()
      if (!Array.isArray(payload)) continue
      for (const project of payload) {
        if (!project?.id) continue
        byId.set(project.id, normalizeProject(project))
      }
    } catch {
      continue
    }
  }

  return unique.map((id) => byId.get(id)).filter(Boolean)
}

function catalogCollectionRank(collection) {
  const name = String(collection.name || '').trim()
  if (/^featured projects$/i.test(name)) return [0, 0]
  const vol = /\bvol\.?\s*(\d+)\b/i.exec(name)
  if (vol) return [1, -Number(vol[1])]
  return [2, 0]
}

export async function getCatalogCollections() {
  const list = await getUserCollections(FEATURED_COLLECTIONS_USER)
  return [...list].sort((a, b) => {
    const ra = catalogCollectionRank(a)
    const rb = catalogCollectionRank(b)
    if (ra[0] !== rb[0]) return ra[0] - rb[0]
    if (ra[1] !== rb[1]) return ra[1] - rb[1]
    return String(b.updated || '').localeCompare(String(a.updated || ''))
  })
}
