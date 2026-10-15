'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { NEWS_BADGE_EVENT } from './NewsCounter'

export const ACCOUNT_UPDATES_KEY = 'account-updates'
const CACHE_MS = 10 * 60 * 1000

export default function AccountUpdatesDot() {
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!document.cookie.includes('mp_signed=1')) {
      setCount(0)
      return undefined
    }
    let alive = true
    try {
      const cached = JSON.parse(sessionStorage.getItem(ACCOUNT_UPDATES_KEY) || 'null')
      if (cached && Date.now() - cached.at < CACHE_MS) {
        setCount(cached.count)
        return undefined
      }
    } catch {}
    fetch('/api/account/updates')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!alive || !data) return
        window.dispatchEvent(new Event(NEWS_BADGE_EVENT))
        setCount(data.count)
        try {
          sessionStorage.setItem(ACCOUNT_UPDATES_KEY, JSON.stringify({ at: Date.now(), count: data.count }))
        } catch {}
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [pathname])

  if (count <= 0) return null
  return (
    <span className="absolute -right-3 -top-2 z-20 flex h-[18px] min-w-[18px] animate-pulse items-center justify-center rounded-full bg-modrinth-green px-1 text-[9px] font-bold text-black shadow-lg">
      {count > 9 ? '9+' : `+${count}`}
    </span>
  )
}
