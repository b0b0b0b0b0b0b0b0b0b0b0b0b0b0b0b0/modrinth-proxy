import { cache } from 'react'
import {
  MODRINTH_SERVER_API,
  modrinthRequestHeaders,
  MODRINTH_FETCH_TIMEOUT_MS,
} from './modrinth'

export const HIDDEN_COLLECTION_IDS = new Set(['M4c3ITvd'])

export function isCollectionHidden(id) {
  return Boolean(id) && HIDDEN_COLLECTION_IDS.has(String(id))
}

export const getHiddenCollectionProjectIds = cache(async () => {
  const ids = new Set()

  await Promise.all(
    [...HIDDEN_COLLECTION_IDS].map(async (collectionId) => {
      try {
        const response = await fetch(
          `${MODRINTH_SERVER_API}/collection/${encodeURIComponent(collectionId)}`,
          {
            headers: modrinthRequestHeaders(),
            signal: AbortSignal.timeout(MODRINTH_FETCH_TIMEOUT_MS),
            next: { revalidate: 3600 },
          },
        )
        if (!response.ok) return
        const payload = await response.json()
        for (const projectId of payload?.projects || []) {
          if (projectId) ids.add(String(projectId))
        }
      } catch {
        // fail open: static blacklist still applies
      }
    }),
  )

  return ids
})
