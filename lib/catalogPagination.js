export async function fetchFilteredCatalogPage({
  searchBatch,
  page,
  limit = 20,
  filterList,
  maxOverfetchBatches = 5,
}) {
  const apiOffset = Math.max(0, (page - 1) * limit)
  let currentOffset = apiOffset
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

  if (!lastBatch) return null

  return {
    ...lastBatch,
    hits: pageHits.slice(0, limit),
    layoutCorrection,
    blockedStats: {
      blockedCount,
      blockedByProject,
      blockedByOrganization,
    },
  }
}
