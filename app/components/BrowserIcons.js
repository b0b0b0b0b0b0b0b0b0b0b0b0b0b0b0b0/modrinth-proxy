const LOGOS = new Set(['chrome', 'firefox', 'edge', 'opera', 'yandex', 'brave', 'vivaldi'])

export function BrowserLogo({ name, className = 'h-6 w-6' }) {
  const file = LOGOS.has(name) ? name : 'chromium'
  return <img src={`/browsers/${file}.png`} alt="" width={128} height={128} draggable={false} className={`${className} select-none object-contain`} />
}

export const BROWSER_LABELS = {
  firefox: 'Firefox',
  chrome: 'Chrome',
  edge: 'Edge',
  opera: 'Opera',
  yandex: 'Yandex Browser',
  brave: 'Brave',
  vivaldi: 'Vivaldi',
}

const CYRILLIC_LABELS = {
  ru: { yandex: 'Яндекс Браузер' },
  uk: { yandex: 'Яндекс Браузер' },
  orv: { yandex: 'Яндексъ Браузеръ' },
}

export function browserLabel(name, locale, product) {
  return CYRILLIC_LABELS[locale]?.[name] || BROWSER_LABELS[name] || product || BROWSER_LABELS.chrome
}
