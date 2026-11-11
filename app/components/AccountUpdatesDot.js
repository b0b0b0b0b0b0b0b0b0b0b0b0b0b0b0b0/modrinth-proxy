'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { NEWS_BADGE_EVENT } from './NewsCounter'
import { hasSignedHint } from '@/lib/signedHint'

export const ACCOUNT_UPDATES_KEY = 'account-updates'
const CACHE_MS = 10 * 60 * 1000
const ACCOUNT_UPDATES_EVENT = 'account-updates-changed'

export function resetAccountUpdates() {
  try {
    sessionStorage.removeItem(ACCOUNT_UPDATES_KEY)
  } catch {}
  window.dispatchEvent(new Event(ACCOUNT_UPDATES_EVENT))
}

function readAccountUpdates() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(ACCOUNT_UPDATES_KEY) || 'null')
    if (cached && Date.now() - cached.at < CACHE_MS) return cached
  } catch {}
  return null
}

let accountUpdatesInflight = null

export function loadAccountUpdates() {
  const cached = readAccountUpdates()
  if (cached) return Promise.resolve(cached)
  if (accountUpdatesInflight) return accountUpdatesInflight
  accountUpdatesInflight = fetch('/api/account/updates')
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!data) return null
      const stored = { at: Date.now(), count: data.count || 0, username: data.username, avatar: data.avatar || null }
      try {
        sessionStorage.setItem(ACCOUNT_UPDATES_KEY, JSON.stringify(stored))
      } catch {}
      return stored
    })
    .catch(() => null)
    .finally(() => {
      accountUpdatesInflight = null
    })
  return accountUpdatesInflight
}

export default function AccountUpdatesDot() {
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!hasSignedHint()) {
      setCount(0)
      return undefined
    }
    let alive = true
    try {
      const cached = readAccountUpdates()
      if (cached) {
        setCount(cached.count || 0)
        return undefined
      }
    } catch {}
    loadAccountUpdates()
      .then((data) => {
        if (!alive || !data) return
        window.dispatchEvent(new Event(NEWS_BADGE_EVENT))
        setCount(data.count || 0)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [pathname])

  useEffect(() => {
    let alive = true
    const reload = () => {
      loadAccountUpdates()
        .then((data) => {
          if (alive) setCount(data?.count || 0)
        })
        .catch(() => {})
    }
    window.addEventListener(ACCOUNT_UPDATES_EVENT, reload)
    return () => {
      alive = false
      window.removeEventListener(ACCOUNT_UPDATES_EVENT, reload)
    }
  }, [])

  if (count <= 0) return null
  return (
    <span className="absolute -right-3 -top-2 z-20 flex h-[18px] min-w-[18px] animate-pulse items-center justify-center rounded-full bg-modrinth-green px-1 text-[9px] font-bold text-black shadow-lg">
      {count > 9 ? '9+' : `+${count}`}
    </span>
  )
}
