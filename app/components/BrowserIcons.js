export function ChromeIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M41.32 14A20 20 0 0 0 6.68 14L15.34 29A10 10 0 0 1 24 14Z" />
      <path fill="#FBBC05" d="M24 44A20 20 0 0 0 41.32 14L24 14A10 10 0 0 1 32.66 29Z" />
      <path fill="#34A853" d="M6.68 14A20 20 0 0 0 24 44L32.66 29A10 10 0 0 1 15.34 29Z" />
      <circle cx="24" cy="24" r="10" fill="#fff" />
      <circle cx="24" cy="24" r="7.8" fill="#4285F4" />
    </svg>
  )
}

export function FirefoxIcon({ className = 'h-6 w-6', id = 'ff' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <radialGradient id={`${id}g`} cx="30%" cy="35%" r="75%">
          <stop offset="0" stopColor="#7542E5" />
          <stop offset="1" stopColor="#3A2A8C" />
        </radialGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE226" />
          <stop offset="0.45" stopColor="#FF7139" />
          <stop offset="1" stopColor="#E31587" />
        </linearGradient>
      </defs>
      <circle cx="25" cy="25" r="14.5" fill={`url(#${id}g)`} />
      <path
        fill={`url(#${id}f)`}
        d="M16.4 6.2c-2.2 2.6-3 5.6-2.6 8.6-1.9-1.4-3-3.4-3.3-5.6A20 20 0 1 0 41.6 15c.8 3.2.4 6.4-1.2 9.2.3-6.8-4.6-12.8-11.4-13.7 3 1.6 5.2 4.8 5.2 8.4a10.9 10.9 0 0 1-21.6 1.8c-.4-3.4.8-6.6 3.2-8.8-1.2-1.6-1.6-3.6-1.4-5.7.6 1.6 1.8 2.8 3.4 3.4 2-1.6 4.6-2.4 7.2-2.4-3.6-1.6-7-2-8.6-1Z"
      />
    </svg>
  )
}

export function BrowserLogo({ family, className, id }) {
  return family === 'firefox' ? <FirefoxIcon className={className} id={id} /> : <ChromeIcon className={className} />
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
