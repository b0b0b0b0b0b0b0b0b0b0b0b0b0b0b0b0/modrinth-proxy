'use client'

import { useEffect, useState } from 'react'
import { callSnowballKitten, isSnowballWalking, onSnowballChange, snowballAllowed } from './KittenSnowball'
import { useT } from './I18nProvider'

export default function SnowballButton() {
  const t = useT()
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!snowballAllowed()) return undefined
    setShown(true)
    setBusy(isSnowballWalking())
    return onSnowballChange(setBusy)
  }, [])

  if (!shown) return null

  return (
    <button
      type="button"
      onClick={callSnowballKitten}
      disabled={busy}
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-100 px-4 py-2 text-sm font-medium text-sky-800 transition-all duration-300 hover:scale-95 hover:bg-sky-200 dark:border-sky-200/30 dark:bg-sky-200/10 dark:text-sky-100 dark:hover:bg-sky-200/20 disabled:cursor-default disabled:opacity-60 disabled:hover:scale-100"
    >
      <span
        aria-hidden
        className={`relative h-4 w-4 shrink-0 rounded-full bg-[#f4f8ff] shadow-[inset_-2px_-2px_3px_rgba(140,170,205,0.6)] ${busy ? 'animate-spin' : ''}`}
      >
        <span className="absolute left-[22%] top-[28%] h-[18%] w-[18%] rounded-full bg-sky-300/80" />
      </span>
      {busy ? t('footer.snowballBusy') : t('footer.snowball')}
    </button>
  )
}
