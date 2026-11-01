'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { festiveBook } from '@/lib/festiveScoreClient'

export default function FestiveScoreSync() {
  const pathname = usePathname()
  const signedRef = useRef(false)

  useEffect(() => {
    festiveBook.listen()
  }, [])

  useEffect(() => {
    const signed = document.cookie.includes('mp_signed=1')
    if (!signed) {
      if (signedRef.current) festiveBook.detach()
      signedRef.current = false
      return
    }
    if (signedRef.current) return
    signedRef.current = true
    festiveBook.claim().then((ok) => {
      if (!ok) signedRef.current = false
    })
  }, [pathname])

  useEffect(() => {
    const flush = () => {
      festiveBook.flushNow(true)
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  return null
}
