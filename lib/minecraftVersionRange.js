const HOME_MC_FROM = '1.7.10'
const FALLBACK_LATEST_RELEASE = '1.21'

function semverishParts(v) {
  const base = String(v).trim().split('-')[0].split('+')[0]
  if (!base) return [0]
  return base.split('.').map((s) => parseInt(s, 10) || 0)
}

export function compareMinecraftVersions(a, b) {
  const pa = semverishParts(a)
  const pb = semverishParts(b)
  const n = Math.max(pa.length, pb.length)
  for (let i = 0; i < n; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da !== db) return da < db ? -1 : 1
  }
  return String(a).localeCompare(String(b))
}

function pickLatestFullToken(fullVersions) {
  if (!Array.isArray(fullVersions) || !fullVersions.length) return null
  const h = fullVersions[0]
  const s = h == null ? '' : String(h).trim()
  return s || null
}

export function getModsVersionRange(releaseVersions, fullVersions) {
  const releases = Array.isArray(releaseVersions) ? releaseVersions.filter(Boolean) : []
  const latestReleaseStr =
    releases.length > 0
      ? [...releases].sort(compareMinecraftVersions)[releases.length - 1]
      : null

  const toVersion = latestReleaseStr || FALLBACK_LATEST_RELEASE
  const latestFull = pickLatestFullToken(fullVersions)
  const compareTarget = latestReleaseStr ?? toVersion
  const snapshotVersion = latestFull && latestFull !== compareTarget ? latestFull : null

  return { fromVersion: HOME_MC_FROM, toVersion, snapshotVersion }
}

export function buildHomeModsVersionCopy(releaseVersions, fullVersions) {
  const releases = Array.isArray(releaseVersions) ? releaseVersions.filter(Boolean) : []
  const latestReleaseStr =
    releases.length > 0
      ? [...releases].sort(compareMinecraftVersions)[releases.length - 1]
      : null

  const shownStableEnd = latestReleaseStr || FALLBACK_LATEST_RELEASE
  const stableLine = `Все версии от ${HOME_MC_FROM} до ${shownStableEnd}`

  const latestFull = pickLatestFullToken(fullVersions)

  const compareTarget = latestReleaseStr ?? shownStableEnd
  const snapshotLine =
    latestFull && latestFull !== compareTarget ? `Также найдёте моды для ${latestFull}.` : null

  return { stableLine, snapshotLine }
}
