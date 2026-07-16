export function parseVersionParams(searchParams) {
  if (!searchParams) return []

  if (typeof searchParams.getAll === 'function') {
    return searchParams.getAll('v').filter(Boolean)
  }

  const value = searchParams.v
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string' && value) return [value]
  return []
}

export function appendVersionParams(params, versions) {
  ;(Array.isArray(versions) ? versions : []).forEach((version) => {
    if (version) params.append('v', version)
  })
}

export function versionFacets(versions) {
  const list = Array.isArray(versions) ? versions.filter(Boolean) : []
  if (list.length === 0) return null
  return list.map((version) => `versions:${version}`)
}
