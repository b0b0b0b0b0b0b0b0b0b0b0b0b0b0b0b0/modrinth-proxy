'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const CHECK_INTERVAL_MS = 60 * 1000
const MIN_GAP_MS = 5 * 1000

export default function SessionWatcher({ userId = null }) {
  const router = useRouter()
  const knownRef = useRef(userId)
  const lastRef = useRef(0)

  useEffect(() => {
    knownRef.current = userId
  }, [userId])

  useEffect(() => {
    let alive = true
    const check = async () => {
      const now = Date.now()
      if (now - lastRef.current < MIN_GAP_MS) return
      lastRef.current = now
      try {
        const res = await fetch('/api/auth/state', { cache: 'no-store' })
        if (!res.ok || !alive) return
        const { id } = await res.json()
        if (id !== knownRef.current) {
          knownRef.current = id
          router.refresh()
        }
      } catch {}
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') check()
    }, CHECK_INTERVAL_MS)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      window.clearInterval(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router])

  return null
}
