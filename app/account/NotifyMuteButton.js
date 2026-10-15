'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import StyledTooltip from '../components/StyledTooltip'

const BELL = 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0'
const BELL_OFF =
  'M10.3 21a1.94 1.94 0 0 0 3.4 0M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7M2 2l20 20'

export default function NotifyMuteButton({ projectId, muted }) {
  const t = useT()
  const router = useRouter()
  const [current, setCurrent] = useState(muted)
  const [busy, setBusy] = useState(false)
  const label = t(current ? 'tg.unmuteProject' : 'tg.muteProject')

  const toggle = async () => {
    if (busy) return
    const next = !current
    setBusy(true)
    setCurrent(next)
    try {
      const response = await fetch('/api/account/notify-mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, muted: next }),
      })
      if (!response.ok) setCurrent(!next)
      else router.refresh()
    } catch {
      setCurrent(!next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <StyledTooltip label={label}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={label}
        aria-pressed={current}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
          current ? 'text-modrinth-green hover:bg-modrinth-green/10' : 'text-gray-600 hover:bg-gray-500/10 hover:text-gray-300 dark:text-gray-500'
        }`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          <path d={current ? BELL : BELL_OFF} />
        </svg>
      </button>
    </StyledTooltip>
  )
}
