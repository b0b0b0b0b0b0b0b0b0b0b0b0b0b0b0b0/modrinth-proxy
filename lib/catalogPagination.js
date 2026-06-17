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

  while (pageHits.length < limit && overfetch <= maxOverfetchBatches) {
    const batchData = await searchBatch({ limit: limit * 2, offset: currentOffset })
    lastBatch = batchData

    if (!batchData?.hits?.length) break

    const filtered = filterList(batchData.hits)
    pageHits = pageHits.concat(filtered.hits)

    if (currentOffset + batchData.hits.length >= batchData.total_hits) break
    if (pageHits.length >= limit) break

    currentOffset += batchData.hits.length
    overfetch++
  }

  if (!lastBatch) return null

  return {
    ...lastBatch,
    hits: pageHits.slice(0, limit),
  }
}
