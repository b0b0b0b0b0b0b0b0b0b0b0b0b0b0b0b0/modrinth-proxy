'use client'

import { useEffect, useState } from 'react'

function clockParts(now, locale, timeZone) {
  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: locale.toLowerCase().startsWith('en') ? 'h12' : 'h23',
  }).formatToParts(now)
  const date = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now)
  return { time, date: date.charAt(0).toLocaleUpperCase(locale) + date.slice(1) }
}

export default function ZoneClock({ timeZone, locale }) {
  const [now, setNow] = useState(null)

  useEffect(() => {
    let interval = 0
    const tick = () => setNow(new Date())
    tick()
    const first = window.setTimeout(() => {
      tick()
      interval = window.setInterval(tick, 1000)
    }, 1000 - (Date.now() % 1000))
    return () => {
      window.clearTimeout(first)
      window.clearInterval(interval)
    }
  }, [])

  let parts = null
  try {
    parts = now && timeZone ? clockParts(now, locale, timeZone) : null
  } catch {}

  return (
    <div className="mt-2 px-1" aria-hidden="true">
      <p className="m-0 text-lg font-bold leading-tight tracking-wide tabular-nums text-white">
        {parts
          ? parts.time.map((part, index) => (
              <span key={`${part.type}-${index}`} className={part.type === 'second' ? 'text-modrinth-green' : undefined}>
                {part.value}
              </span>
            ))
          : ' '}
      </p>
      <p className="m-0 mt-0.5 text-xs leading-snug text-gray-600 dark:text-gray-500">{parts ? parts.date : ' '}</p>
    </div>
  )
}
