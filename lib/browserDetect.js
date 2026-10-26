export const EXTENSION_STORES = {
  firefox: 'https://addons.mozilla.org/firefox/addon/modrinth-redirect/',
  chromium: 'https://chromewebstore.google.com/detail/modrinth-redirect/poamgpbaabemlgienajmcolicdiapekg',
}

const CHROMIUM_NAMES = [
  [/YaBrowser\//, 'yandex'],
  [/Edg(A|iOS)?\//, 'edge'],
  [/OPR\/|Opera/, 'opera'],
  [/Vivaldi\//, 'vivaldi'],
]

const COMMON_TOKENS = new Set(['Mozilla', 'AppleWebKit', 'Chrome', 'Safari', 'Gecko', 'Version'])

const PRODUCT_NAMES = {
  Whale: 'Whale',
  coc_coc_browser: 'Cốc Cốc',
  Atom: 'Atom',
  Chromium: 'Chromium',
  Maxthon: 'Maxthon',
  QQBrowser: 'QQ Browser',
  Iron: 'SRWare Iron',
  Thorium: 'Thorium',
}

export function detectBrowser(userAgent = '', clientHints = '') {
  const ua = String(userAgent || '')
  const hints = String(clientHints || '')
  if (!ua) return { family: null, name: null }
  if (/iPhone|iPad|iPod/.test(ua)) return { family: null, name: null }
  if (/Firefox\//.test(ua) && !/Seamonkey\//i.test(ua)) return { family: 'firefox', name: 'firefox' }
  if (/Android|Mobile/.test(ua)) return { family: null, name: null }
  if (!/Chrome\/|Chromium\//.test(ua) || /Electron\//.test(ua)) return { family: null, name: null }
  const named = CHROMIUM_NAMES.find(([pattern]) => pattern.test(ua))
  if (named) return { family: 'chromium', name: named[1] }
  if (/Brave/i.test(hints)) return { family: 'chromium', name: 'brave' }
  const extra = [...ua.matchAll(/([A-Za-z][\w-]*)\/\d[\d.]*/g)].map((match) => match[1]).find((token) => !COMMON_TOKENS.has(token))
  if (extra) return { family: 'chromium', name: 'chromium', product: PRODUCT_NAMES[extra] || 'Chromium' }
  return { family: 'chromium', name: 'chrome' }
}

export function detectClientBrowser() {
  if (typeof navigator === 'undefined') return { family: null, name: null }
  const brands = (navigator.userAgentData?.brands || []).map((brand) => brand.brand).join(' ')
  const hints = navigator.brave ? `${brands} Brave` : brands
  return detectBrowser(navigator.userAgent, hints)
}
