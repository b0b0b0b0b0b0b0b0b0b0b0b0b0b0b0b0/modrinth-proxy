export const MODRINTH_SEARCH_MAX_OFFSET = 72280

export function getCatalogTotalPages(totalHits, limit = 20) {
  if (!totalHits || totalHits <= 0) return 0
  const accessibleHits = Math.min(totalHits, MODRINTH_SEARCH_MAX_OFFSET)
  return Math.max(1, Math.ceil(accessibleHits / limit))
}

export function clampCatalogPage(page, totalHits, limit = 20) {
  const totalPages = getCatalogTotalPages(totalHits, limit)
  if (totalPages <= 0) return 1

  const apiCapPage = getCatalogTotalPages(MODRINTH_SEARCH_MAX_OFFSET, limit)
  const normalizedPage = Math.min(Math.max(1, page), apiCapPage)
  return Math.min(normalizedPage, totalPages)
}

async function fetchCatalogBatchWindow({
  searchBatch,
  page,
  limit,
  filterList,
  maxOverfetchBatches,
}) {
  let currentOffset = Math.max(0, (page - 1) * limit)
  let pageHits = []
  let lastBatch = null
  let overfetch = 0
  let layoutCorrection = null
  let blockedCount = 0
  let blockedByProject = 0
  let blockedByOrganization = 0

  while (pageHits.length < limit && overfetch <= maxOverfetchBatches) {
    const batchData = await searchBatch({ limit, offset: currentOffset })
    lastBatch = batchData

    if (batchData?.layoutCorrection) {
      layoutCorrection = batchData.layoutCorrection
    }

    if (!batchData?.hits?.length) break

    const filtered = filterList(batchData.hits)
    blockedCount += filtered.blockedCount
    blockedByProject += filtered.blockedByProject
    blockedByOrganization += filtered.blockedByOrganization
    pageHits = pageHits.concat(filtered.hits)

    if (currentOffset + batchData.hits.length >= batchData.total_hits) break
    if (pageHits.length >= limit) break

    currentOffset += limit
    overfetch++
  }

  return {
    lastBatch,
    pageHits: pageHits.slice(0, limit),
    layoutCorrection,
    blockedStats: {
      blockedCount,
      blockedByProject,
      blockedByOrganization,
    },
  }
}

export async function fetchFilteredCatalogPage({
  searchBatch,
  page,
  limit = 20,
  filterList,
  maxOverfetchBatches = 5,
}) {
  const apiCapPage = getCatalogTotalPages(MODRINTH_SEARCH_MAX_OFFSET, limit)
  let effectivePage = Math.min(Math.max(1, page), apiCapPage || 1)

  let result = await fetchCatalogBatchWindow({
    searchBatch,
    page: effectivePage,
    limit,
    filterList,
    maxOverfetchBatches,
  })

  if (!result.lastBatch) return null

  if (result.lastBatch.total_hits) {
    const clampedPage = clampCatalogPage(page, result.lastBatch.total_hits, limit)
    if (clampedPage !== effectivePage) {
      effectivePage = clampedPage
      result = await fetchCatalogBatchWindow({
        searchBatch,
        page: effectivePage,
        limit,
        filterList,
        maxOverfetchBatches,
      })
      if (!result.lastBatch) return null
    }
  }

  return {
    ...result.lastBatch,
    hits: result.pageHits,
    layoutCorrection: result.layoutCorrection,
    effectivePage,
    totalPages: getCatalogTotalPages(result.lastBatch.total_hits, limit),
    blockedStats: result.blockedStats,
  }
}
