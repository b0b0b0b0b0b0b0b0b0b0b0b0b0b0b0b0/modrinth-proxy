import { fetchFilteredCatalogPage } from '@/lib/catalogPagination'

export async function loadCatalogPage({
  searchBatch,
  page,
  limit = 20,
  filterList,
  logLabel = 'catalog',
}) {
  try {
    const data = await fetchFilteredCatalogPage({
      searchBatch,
      page,
      limit,
      filterList,
    })

    const stats = data?.blockedStats ?? {}

    return {
      data,
      layoutCorrection: data?.layoutCorrection ?? null,
      blockedCount: stats.blockedCount ?? 0,
      blockedByProject: stats.blockedByProject ?? 0,
      blockedByOrganization: stats.blockedByOrganization ?? 0,
      error: null,
    }
  } catch (err) {
    console.error(`Failed to load ${logLabel}:`, err)
    return {
      data: null,
      layoutCorrection: null,
      blockedCount: 0,
      blockedByProject: 0,
      blockedByOrganization: 0,
      error: err,
    }
  }
}
