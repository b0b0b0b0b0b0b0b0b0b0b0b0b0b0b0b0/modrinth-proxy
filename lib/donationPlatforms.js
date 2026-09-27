const ALIAS = {
  github: 'github',
  github_sponsors: 'github',
  bmac: 'bmac',
  buy_me_a_coffee: 'bmac',
  buymeacoffee: 'bmac',
  patreon: 'patreon',
  paypal: 'paypal',
  ko_fi: 'kofi',
  kofi: 'kofi',
  opencollective: 'opencollective',
  open_collective: 'opencollective',
}

function slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

export function resolveDonationPlatform(donation) {
  for (const raw of [donation?.id, donation?.platform]) {
    const key = ALIAS[slug(raw)]
    if (key) return key
  }
  return 'other'
}

export function donationLabelKey(platform) {
  switch (platform) {
    case 'bmac':
      return 'links.donateBmac'
    case 'github':
      return 'links.donateGithub'
    case 'patreon':
      return 'links.donatePatreon'
    case 'paypal':
      return 'links.donatePaypal'
    case 'kofi':
      return 'links.donateKofi'
    case 'opencollective':
      return 'links.donateOpenCollective'
    default:
      return 'links.donate'
  }
}

export function trimExternalUrl(url) {
  return typeof url === 'string' ? url.trim() : ''
}
