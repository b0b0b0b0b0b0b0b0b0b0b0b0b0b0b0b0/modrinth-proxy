'use client'

import { useEffect } from 'react'
import { hasSignedHint } from '@/lib/signedHint'

function send(path, url) {
  fetch(path, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }).catch(() => {})
}

export default function DownloadHistoryTracker() {
  useEffect(() => {
    const onClick = (event) => {
      if (event.type === 'auxclick' && event.button !== 1) return
      const link = event.target?.closest?.('a[href^="https://cdn.modrinth.com/data/"]')
      if (!link) return
      send('/api/download', link.href)
      if (hasSignedHint()) send('/api/account/download', link.href)
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('auxclick', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('auxclick', onClick, true)
    }
  }, [])

  return null
}
