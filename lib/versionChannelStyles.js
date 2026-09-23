const CHANNEL_BADGE = {
  release: 'bg-version-release-bg text-version-release-fg border-version-release-fg/25',
  beta: 'bg-version-beta-bg text-version-beta-fg border-version-beta-fg/25',
  alpha: 'bg-version-alpha-bg text-version-alpha-fg border-version-alpha-fg/25',
}

const CHANNEL_CARD = {
  release: 'border-version-release-fg/30 bg-version-release-bg',
  beta: 'border-version-beta-fg/30 bg-version-beta-bg',
  alpha: 'border-version-alpha-fg/30 bg-version-alpha-bg',
}

const CHANNEL_CARD_SELECTED = {
  release: 'border-version-release-fg/55 ring-1 ring-version-release-fg/35',
  beta: 'border-version-beta-fg/55 ring-1 ring-version-beta-fg/35',
  alpha: 'border-version-alpha-fg/55 ring-1 ring-version-alpha-fg/35',
}

function channelKey(versionType) {
  const key = String(versionType || 'release').toLowerCase().replace(/\s+/g, '_')
  if (key === 'beta' || key === 'alpha') return key
  return 'release'
}

export function versionChannelLetterRingClass(versionType) {
  return CHANNEL_BADGE[channelKey(versionType)]
}

export function versionChannelBadgeClass(versionType) {
  return CHANNEL_BADGE[channelKey(versionType)]
}

export function versionChannelCardClass(versionType, selected = false) {
  const key = channelKey(versionType)
  if (selected) return `${CHANNEL_CARD[key]} ${CHANNEL_CARD_SELECTED[key]}`
  return CHANNEL_CARD[key]
}

export function versionChannelSelectedCardClass(versionType) {
  return versionChannelCardClass(versionType, true)
}
