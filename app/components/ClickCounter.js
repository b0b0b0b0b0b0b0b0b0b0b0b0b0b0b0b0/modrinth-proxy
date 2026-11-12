'use client'

import { useEffect } from 'react'

const KINDS = [
  ['data-app-dl', 'app'],
  ['data-server-click', 'server'],
]

export default function ClickCounter() {
  useEffect(() => {
    const onClick = (event) => {
      if (event.type === 'auxclick' && event.button !== 1) return
      for (const [attribute, field] of KINDS) {
        const target = event.target?.closest?.(`[${attribute}]`)
        if (!target) continue
        fetch('/api/download', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: target.getAttribute(attribute) }),
        }).catch(() => {})
        return
      }
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
