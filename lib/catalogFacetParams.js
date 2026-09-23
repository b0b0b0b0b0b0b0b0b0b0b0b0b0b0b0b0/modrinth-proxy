const INCLUDE = 'categories:'
const EXCLUDE = 'categories!='

function decodeParam(param) {
  return decodeURIComponent(String(param || ''))
}

export function parseFacetList(values) {
  const included = []
  const excluded = []
  for (const param of values || []) {
    if (!param) continue
    const decoded = decodeParam(param)
    if (decoded.startsWith(EXCLUDE)) {
      const id = decoded.slice(EXCLUDE.length)
      if (id && !excluded.includes(id)) excluded.push(id)
    } else if (decoded.startsWith(INCLUDE)) {
      const id = decoded.slice(INCLUDE.length)
      if (id && !included.includes(id)) included.push(id)
    }
  }
  return { included, excluded }
}

export function appendFacetParams(params, key, included = [], excluded = []) {
  included.forEach((id) => params.append(key, `${INCLUDE}${id}`))
  excluded.forEach((id) => params.append(key, `${EXCLUDE}${id}`))
}

export function appendNegatedFacets(facets, ids) {
  ;(ids || []).forEach((id) => {
    if (id) facets.push([`${EXCLUDE}${id}`])
  })
}

export function toggleIncluded(id, included, excluded) {
  if (included.includes(id)) {
    return {
      included: included.filter((item) => item !== id),
      excluded: excluded.filter((item) => item !== id),
    }
  }
  return {
    included: [...included.filter((item) => item !== id), id],
    excluded: excluded.filter((item) => item !== id),
  }
}

export function pickIds(ids, allow) {
  const allowSet = new Set(allow || [])
  return (ids || []).filter((id) => allowSet.has(id))
}

export function toggleExcluded(id, included, excluded) {
  if (excluded.includes(id)) {
    return {
      included: included.filter((item) => item !== id),
      excluded: excluded.filter((item) => item !== id),
    }
  }
  return {
    included: included.filter((item) => item !== id),
    excluded: [...excluded.filter((item) => item !== id), id],
  }
}
