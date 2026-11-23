'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { deliverProject, projectSlugFrom } from '@/lib/courierClient'

const COOLDOWN_MS = 10 * 60 * 1000
const ATTEMPTS_KEY = 'authorsCourierAttempts'

function takeAttempt(slug) {
  try {
    const attempts = JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) || '{}')
    if (Date.now() - (Number(attempts[slug]) || 0) < COOLDOWN_MS) return false
    attempts[slug] = Date.now()
    sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
    return true
  } catch {
    return false
  }
}

export default function AuthorsCourier() {
  const pathname = usePathname()
  const router = useRouter()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const slug = projectSlugFrom(pathname)
    if (!slug || !takeAttempt(slug.toLowerCase())) return
    deliverProject(slug, { withVersions: false })
      .then((ok) => {
        if (ok) router.refresh()
      })
      .catch(() => {})
  }, [])

  return null
}
