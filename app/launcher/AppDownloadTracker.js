'use client'

import { useEffect } from 'react'

export default function AppDownloadTracker() {
  useEffect(() => {
    const onClick = (event) => {
      if (event.type === 'auxclick' && event.button !== 1) return
      const target = event.target?.closest?.('[data-app-dl]')
      if (!target) return
      fetch('/api/download', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: target.dataset.appDl }),
      }).catch(() => {})
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
