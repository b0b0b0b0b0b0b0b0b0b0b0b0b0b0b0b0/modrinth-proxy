export function getPaginationItems(currentPage, totalPages, options = {}) {
  const siblings = options.siblings ?? 1
  const boundaries = options.boundaries ?? 1

  if (totalPages <= 1) return []

  const pages = new Set()

  for (let i = 1; i <= Math.min(boundaries, totalPages); i++) {
    pages.add(i)
  }

  for (let i = Math.max(1, totalPages - boundaries + 1); i <= totalPages; i++) {
    pages.add(i)
  }

  for (let i = currentPage - siblings; i <= currentPage + siblings; i++) {
    if (i >= 1 && i <= totalPages) pages.add(i)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const items = []

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      items.push({ type: 'ellipsis', key: `gap-${sorted[i - 1]}-${sorted[i]}` })
    }
    items.push({ type: 'page', page: sorted[i], key: `page-${sorted[i]}` })
  }

  return items
}

export function buildCatalogPageUrl(pathname, searchParams, page) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams || {})) {
    if (key === 'page') continue
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry != null && entry !== '') params.append(key, String(entry))
      })
      continue
    }
    if (value != null && value !== '') params.set(key, String(value))
  }

  params.set('page', String(page))
  return `${pathname}?${params.toString()}`
}
