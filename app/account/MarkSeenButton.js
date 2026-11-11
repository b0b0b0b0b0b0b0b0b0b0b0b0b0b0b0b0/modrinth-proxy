'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetAccountUpdates } from '../components/AccountUpdatesDot'

export default function MarkSeenButton({ projectId = null, versionId = null, variant = '', label, className }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const mark = async () => {
    setBusy(true)
    try {
      await fetch('/api/account/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectId ? { projectId, versionId, variant } : {}),
      })
      resetAccountUpdates()
      router.refresh()
    } catch {
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" onClick={mark} disabled={busy} className={className}>
      {label}
    </button>
  )
}

export function UpdateDownloadLink({ href, fileName, label, className }) {
  const router = useRouter()

  const refreshSoon = () => {
    setTimeout(() => {
      resetAccountUpdates()
      router.refresh()
    }, 2000)
  }

  return (
    <a href={href} download={fileName} onClick={refreshSoon} className={className}>
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
        <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
      </svg>
      {label}
    </a>
  )
}
