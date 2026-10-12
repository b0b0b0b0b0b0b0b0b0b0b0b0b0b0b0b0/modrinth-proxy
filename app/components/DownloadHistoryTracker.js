'use client'

import { useEffect } from 'react'

export default function DownloadHistoryTracker() {
  useEffect(() => {
    const onClick = (event) => {
      if (!document.cookie.includes('mp_signed=1')) return
      const link = event.target?.closest?.('a[href^="https://cdn.modrinth.com/data/"]')
      if (!link) return
      fetch('/api/account/download', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link.href }),
      }).catch(() => {})
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
