const KIND = Object.freeze({
  semver: 3,
  weekly: 2,
  fuzzy: 1,
  raw: 0,
})

const CHANNEL = Object.freeze({
  release: 4,
  rc: 3,
  pre: 2,
  snapshot: 1,
  other: 0,
})

function parseComparableKey(versionString) {
  const s = String(versionString).trim()
  let m

  if ((m = /^(\d+)\.(\d+)(?:\.(\d+))?-(snapshot|pre|rc)-(\d+)$/i.exec(s))) {
    return {
      kind: KIND.semver,
      nums: [+m[1], +m[2], m[3] ? +m[3] : 0],
      channel: CHANNEL[m[4].toLowerCase()] ?? CHANNEL.other,
      extra: +m[5],
      raw: null,
    }
  }

  if ((m = /^(\d+)\.(\d+)(?:\.(\d+))?-(pre|rc)(\d+)$/i.exec(s))) {
    return {
      kind: KIND.semver,
      nums: [+m[1], +m[2], m[3] ? +m[3] : 0],
      channel: CHANNEL[m[4].toLowerCase()] ?? CHANNEL.other,
      extra: +m[5],
      raw: null,
    }
  }

  if ((m = /^(\d+)\.(\d+)\.(\d+)$/.exec(s))) {
    return { kind: KIND.semver, nums: [+m[1], +m[2], +m[3]], channel: CHANNEL.release, extra: 0, raw: null }
  }

  if ((m = /^(\d+)\.(\d+)$/.exec(s))) {
    return { kind: KIND.semver, nums: [+m[1], +m[2], 0], channel: CHANNEL.release, extra: 0, raw: null }
  }

  if ((m = /^(\d+)\.(\d+)(?:\.(\d+))?-(.+)$/i.exec(s))) {
    return {
      kind: KIND.semver,
      nums: [+m[1], +m[2], m[3] ? +m[3] : 0],
      channel: CHANNEL.other,
      extra: 0,
      raw: m[4],
    }
  }

  if ((m = /^(\d+)w(\d+)([a-z]?)$/i.exec(s))) {
    const letter = (m[3] || '`').toLowerCase()
    const ord = letter ? letter.charCodeAt(0) : 96
    return { kind: KIND.weekly, nums: [+m[1], +m[2], ord], channel: CHANNEL.other, extra: 0, raw: null }
  }

  const head = /^[\d.]+/.exec(s)
  const fv = parseFloat(head?.[0] ?? 'NaN')
  if (!Number.isNaN(fv)) {
    return { kind: KIND.fuzzy, nums: [fv, 0, 0], channel: CHANNEL.other, extra: 0, raw: null }
  }

  return { kind: KIND.raw, nums: [], channel: CHANNEL.other, extra: 0, raw: s }
}

export function compareMinecraftVersionsDesc(a, b) {
  const ka = parseComparableKey(a)
  const kb = parseComparableKey(b)

  if (ka.kind !== kb.kind) return kb.kind - ka.kind

  const len = Math.max(ka.nums.length, kb.nums.length)
  for (let i = 0; i < len; i++) {
    const na = ka.nums[i] ?? 0
    const nb = kb.nums[i] ?? 0
    if (na !== nb) return nb - na
  }

  if (ka.channel !== kb.channel) return kb.channel - ka.channel
  if (ka.extra !== kb.extra) return kb.extra - ka.extra

  if (ka.raw != null && kb.raw != null && ka.raw !== kb.raw) {
    return String(kb.raw).localeCompare(String(ka.raw), undefined, { numeric: true, sensitivity: 'base' })
  }

  return String(b).localeCompare(String(a))
}

function versionBelongsToMinorLine(versionString, minorPrefix) {
  const v = String(versionString).trim()
  const prefix = minorPrefix.trim()
  if (!prefix || !v) return false
  if (v === prefix) return true
  if (v.startsWith(`${prefix}.`)) return true
  if (v.startsWith(`${prefix}-`)) return true
  return false
}

function minorPrefixOf(versionString) {
  const m = /^(\d+)\.(\d+)/.exec(String(versionString).trim())
  return m ? `${m[1]}.${m[2]}` : null
}

function familyMaxComparableToken(k, group) {
  let best = null
  const bump = (t) => {
    const ts = String(t)
    if (best == null || compareMinecraftVersionsDesc(ts, best) < 0) {
      best = ts
    }
  }
  group.patches.forEach(bump)
  group.snaps.forEach(bump)
  group.prereleases.forEach(bump)
  return best || k
}

function highestComparableTokenFromCompressedRange(range) {
  const r = String(range).trim()
  const parts = r.split(/\u2013/)
  const leaf = parts.length > 1 ? parts[parts.length - 1].trim() : r
  if (/\.x$/i.test(leaf)) {
    const base = leaf.slice(0, -2).replace(/\.$/, '')
    const segs = base.split('.').filter(Boolean)
    if (segs.length >= 2) return `${segs[0]}.${segs[1]}.999999`
    return base
  }
  return leaf
}

export function sortCompressedRangesDesc(ranges) {
  if (!ranges?.length) return []
  return [...ranges].sort((a, b) =>
    compareMinecraftVersionsDesc(
      highestComparableTokenFromCompressedRange(a),
      highestComparableTokenFromCompressedRange(b)
    )
  )
}

function versionsInMinorLine(prefix, rawVersions) {
  return rawVersions.filter((v) => versionBelongsToMinorLine(v, prefix))
}

export function versionsForCompressedRange(range, rawVersions) {
  if (!Array.isArray(rawVersions) || rawVersions.length === 0) return []
  const uniq = [...new Set(rawVersions.map(String))]
  const r = String(range).trim()
  if (!r) return []

  const sortDesc = (arr) => [...arr].sort(compareMinecraftVersionsDesc)

  const enParts = r.split(/\u2013/)
  if (enParts.length > 1) {
    const first = enParts[0].trim()
    const last = enParts[enParts.length - 1].trim()
    const matched = uniq.filter(
      (v) =>
        compareMinecraftVersionsDesc(v, first) <= 0 &&
        compareMinecraftVersionsDesc(last, v) <= 0
    )
    return sortDesc(matched)
  }

  const xMatch = /^(\d+\.\d+)\.x$/i.exec(r)
  const prefix = xMatch ? xMatch[1] : minorPrefixOf(r)
  if (prefix) {
    const matched = versionsInMinorLine(prefix, uniq)
    if (matched.length) return sortDesc(matched)
  }

  return uniq.includes(r) ? [r] : []
}

export function facetMcVersionQuery(range, rawVersions) {
  if (!Array.isArray(rawVersions) || rawVersions.length === 0) return null
  const sorted = [...rawVersions].sort(compareMinecraftVersionsDesc)
  const r = String(range).trim()

  if (sorted.includes(r) && !/\.x$/i.test(r)) return r

  const enParts = r.split(/\u2013/)
  if (enParts.length > 1) {
    const hi = enParts[enParts.length - 1].trim()
    if (sorted.includes(hi)) return hi
    const nested = facetMcVersionQuery(hi, sorted)
    if (nested) return nested
  }

  const xMatch = /^(\d+\.\d+)\.x$/i.exec(r)
  const prefix = xMatch ? xMatch[1] : minorPrefixOf(r)
  if (prefix) {
    const inLine = sorted.filter((v) => versionBelongsToMinorLine(v, prefix))
    const release = inLine.find((v) => parseComparableKey(v).channel === CHANNEL.release)
    return release ?? inLine[0] ?? null
  }

  return null
}

export function compressSidebarGameVersions(rawVersions) {
  const uniq = [
    ...new Set((rawVersions || []).map((s) => String(s).trim()).filter(Boolean)),
  ]
  if (uniq.length <= 1) return uniq.slice().sort(compareMinecraftVersionsDesc)

  const byMM = new Map()
  const misc = []

  const ensure = (k) => {
    if (!byMM.has(k))
      byMM.set(k, { patches: new Set(), snaps: new Set(), prereleases: new Set() })
    return byMM.get(k)
  }

  for (const v of uniq) {
    let m = /^(\d+)\.(\d+)(?:\.(\d+))?-(snapshot|pre|rc)-(\d+)$/i.exec(v)
    if (m) {
      const g = ensure(`${m[1]}.${m[2]}`)
      if (m[4].toLowerCase() === 'snapshot') g.snaps.add(v)
      else g.prereleases.add(v)
      continue
    }
    m = /^(\d+)\.(\d+)(?:\.(\d+))?-(pre|rc)\d+/i.exec(v)
    if (m) {
      ensure(`${m[1]}.${m[2]}`).prereleases.add(v)
      continue
    }
    m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v)
    if (m) {
      ensure(`${m[1]}.${m[2]}`).patches.add(v)
      continue
    }
    m = /^(\d+)\.(\d+)$/.exec(v)
    if (m) {
      ensure(`${m[1]}.${m[2]}`).patches.add(v)
      continue
    }
    misc.push(v)
  }

  const keys = [...byMM.keys()].sort((a, b) =>
    compareMinecraftVersionsDesc(
      familyMaxComparableToken(a, byMM.get(a)),
      familyMaxComparableToken(b, byMM.get(b)),
    ),
  )

  const out = []
  let literalSnapFamilyDone = false

  for (const k of keys) {
    const g = byMM.get(k)
    const hasP = g.patches.size > 0

    if (!hasP) {
      const extras = [...g.snaps, ...g.prereleases].sort(compareMinecraftVersionsDesc)
      if (!extras.length) continue
      if (!literalSnapFamilyDone) {
        out.push(extras[0])
        literalSnapFamilyDone = true
      } else {
        out.push(`${k}.x`)
      }
      continue
    }

    if (g.patches.size === 1) {
      out.push([...g.patches][0])
    } else {
      out.push(`${k}.x`)
    }
  }

  misc.sort(compareMinecraftVersionsDesc).forEach((x) => out.push(x))

  return out
}

export function formatServerSidebarVersions(rawVersions, recommendedVersion) {
  const rec = recommendedVersion?.trim() || null
  const compressed = compressSidebarGameVersions(rawVersions || [])

  if (!rec) {
    return compressed.map((range) => ({ kind: 'range', range }))
  }

  const items = [{ kind: 'recommended', version: rec }]

  for (const range of compressed) {
    if (range === rec) continue
    const expanded = versionsForCompressedRange(range, rawVersions)
    if (expanded.length === 1 && expanded[0] === rec) continue
    items.push({ kind: 'range', range })
  }

  return items
}
