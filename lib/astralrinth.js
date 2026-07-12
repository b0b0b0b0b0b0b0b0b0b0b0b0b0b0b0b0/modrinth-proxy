const RELEASE_URL =
  'https://git.astralium.su/api/v1/repos/didirus/AstralRinth/releases/latest'

const REVALIDATE_SECONDS = 21600
const REQUEST_TIMEOUT_MS = 8000
const MIN_RETRY_INTERVAL_MS = 5 * 60 * 1000

let lastGood = null
let lastAttemptAt = 0

function parseVersionFromTag(tag) {
  if (!tag || typeof tag !== 'string') return ''
  return tag.trim().replace(/^AR-/i, '').replace(/^v/i, '')
}

function isSideChannelBuild(name) {
  return /nightly|experi?mental/i.test(name)
}

function classifyAsset(name) {
  if (/_x64-setup\.exe$/i.test(name)) return { platform: 'windows', kind: 'exe' }
  if (/\.msi$/i.test(name)) return { platform: 'windows', kind: 'msi' }
  if (/aarch64\.dmg$/i.test(name)) return { platform: 'macos', kind: 'dmg' }
  if (/x64\.dmg$/i.test(name)) return { platform: 'macos', kind: 'dmg-x64' }
  if (/\.AppImage$/i.test(name)) return { platform: 'linux', kind: 'appimage' }
  if (/\.deb$/i.test(name)) return { platform: 'linux', kind: 'deb' }
  if (/\.rpm$/i.test(name)) return { platform: 'linux', kind: 'rpm' }
  return null
}

function buildDownloads(assets) {
  const downloads = {
    windows: null,
    windowsMsi: null,
    macos: null,
    linux: { appimage: null, deb: null, rpm: null },
  }

  for (const asset of assets) {
    const name = asset?.name || ''
    const url = asset?.browser_download_url
    if (!url || isSideChannelBuild(name)) continue

    const info = classifyAsset(name)
    if (!info) continue

    if (info.platform === 'windows' && info.kind === 'exe' && !downloads.windows) {
      downloads.windows = url
    } else if (info.platform === 'windows' && info.kind === 'msi' && !downloads.windowsMsi) {
      downloads.windowsMsi = url
    } else if (info.platform === 'macos' && info.kind === 'dmg' && !downloads.macos) {
      downloads.macos = url
    } else if (info.platform === 'linux' && info.kind === 'appimage' && !downloads.linux.appimage) {
      downloads.linux.appimage = url
    } else if (info.platform === 'linux' && info.kind === 'deb' && !downloads.linux.deb) {
      downloads.linux.deb = url
    } else if (info.platform === 'linux' && info.kind === 'rpm' && !downloads.linux.rpm) {
      downloads.linux.rpm = url
    }
  }

  return downloads
}

export async function getAstralRinthData() {
  const now = Date.now()
  if (lastGood && now - lastAttemptAt < MIN_RETRY_INTERVAL_MS) {
    return lastGood
  }
  lastAttemptAt = now

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(RELEASE_URL, {
      headers: {
        'User-Agent': 'ModrinthProxy/1.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    })

    if (!response.ok) {
      throw new Error(`Forgejo API error: ${response.status}`)
    }

    const release = await response.json()
    const assets = Array.isArray(release.assets) ? release.assets : []
    const downloads = buildDownloads(assets)

    if (!downloads.windows && !downloads.macos && !downloads.linux.appimage) {
      throw new Error('No recognizable AstralRinth assets in release')
    }

    const data = {
      version: parseVersionFromTag(release.tag_name),
      tag_name: release.tag_name,
      published_at: release.published_at,
      html_url: release.html_url,
      source: 'astralrinth',
      downloads,
    }

    lastGood = data
    return data
  } catch (error) {
    console.error('Error fetching AstralRinth data:', error?.message || error)
    return lastGood
  } finally {
    clearTimeout(timeout)
  }
}
