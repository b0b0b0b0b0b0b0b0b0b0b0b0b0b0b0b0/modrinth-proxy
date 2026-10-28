const CHANNEL_BADGE = {
  release: 'bg-version-release-bg text-version-release-fg border-version-release-fg/25',
  beta: 'bg-version-beta-bg text-version-beta-fg border-version-beta-fg/25',
  alpha: 'bg-version-alpha-bg text-version-alpha-fg border-version-alpha-fg/25',
}

const CHANNEL_CARD = {
  release: 'channel-glass channel-glass--release bg-version-release-bg',
  beta: 'channel-glass channel-glass--beta bg-version-beta-bg',
  alpha: 'channel-glass channel-glass--alpha bg-version-alpha-bg',
}

const CHANNEL_CARD_SELECTED = {
  release: 'channel-glass--selected',
  beta: 'channel-glass--selected',
  alpha: 'channel-glass--selected',
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
