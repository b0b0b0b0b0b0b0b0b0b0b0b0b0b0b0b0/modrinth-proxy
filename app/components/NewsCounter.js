'use client'

import { useState, useEffect } from 'react'
import { SITE_VERSION } from '@/lib/siteVersion'
import { NEWS_LAST_SHA_KEY, NEWS_SITE_VERSION_KEY, NEWS_UNREAD_KEY } from '@/lib/newsUnread'

export const NEWS_BADGE_EVENT = 'newsBadgeChange'

function badgeHidden() {
  return document.cookie.includes('mp_signed=1') && document.cookie.includes('mp_news_off=1')
}

export default function NewsCounter() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const sync = () => setHidden(badgeHidden())
    sync()
    window.addEventListener(NEWS_BADGE_EVENT, sync)
    return () => window.removeEventListener(NEWS_BADGE_EVENT, sync)
  }, [])

  useEffect(() => {
    const storedUnread = Number.parseInt(localStorage.getItem(NEWS_UNREAD_KEY) || '0', 10)
    if (Number.isFinite(storedUnread) && storedUnread > 0) setUnreadCount(storedUnread)

    const clearUnread = () => setUnreadCount(0)
    window.addEventListener('commitsRead', clearUnread)

    if (localStorage.getItem(NEWS_SITE_VERSION_KEY) !== String(SITE_VERSION)) {
      const checkUnread = async () => {
        try {
          const lastSeenSha = localStorage.getItem(NEWS_LAST_SHA_KEY)
          const res = await fetch(`/api/commits?v=${encodeURIComponent(SITE_VERSION)}`, { cache: 'no-store' })
          const commits = await res.json()
          if (!Array.isArray(commits) || commits.length === 0) return

          localStorage.setItem(NEWS_SITE_VERSION_KEY, String(SITE_VERSION))

          if (!lastSeenSha) {
            localStorage.setItem(NEWS_LAST_SHA_KEY, commits[0].sha)
            localStorage.setItem(NEWS_UNREAD_KEY, '0')
            setUnreadCount(0)
            return
          }

          const lastSeenIndex = commits.findIndex((c) => c.sha === lastSeenSha)
          const unread = lastSeenIndex === -1 ? Math.min(commits.length, 20) : lastSeenIndex
          localStorage.setItem(NEWS_UNREAD_KEY, String(unread))
          setUnreadCount(unread)
        } catch (error) {
          console.error('Error checking unread commits:', error)
        }
      }
      checkUnread()
    }

    return () => window.removeEventListener('commitsRead', clearUnread)
  }, [])

  if (unreadCount === 0 || hidden) return null

  return (
    <span className="absolute -right-3 -top-2 z-20 flex h-[18px] min-w-[18px] animate-pulse items-center justify-center rounded-full bg-modrinth-green px-1 text-[9px] font-bold text-black shadow-lg">
      {unreadCount > 9 ? '9+' : `+${unreadCount}`}
    </span>
  )
}
