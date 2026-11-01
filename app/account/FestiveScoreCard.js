'use client'

import { useLayoutEffect, useState } from 'react'
import { useI18n } from '../components/I18nProvider'
import { intlLocale } from '@/lib/i18n/config'
import { festiveOff, onFestiveChange } from '@/lib/festive'
import { festiveBook } from '@/lib/festiveScoreClient'

const ROWS = [
  {
    id: 'ghosts',
    label: 'account.caughtGhosts',
    icon: 'M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z',
  },
  {
    id: 'ornaments',
    label: 'account.caughtOrnaments',
    icon: 'M12 3v2M10.5 4h3M12 5.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z',
  },
  {
    id: 'cookies',
    label: 'account.caughtCookies',
    icon: 'M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5zM8.5 8.5h.01M15 9h.01M10 13h.01M15.5 14.5h.01',
  },
]

function stored(initial) {
  return {
    ghosts: initial?.ghosts || 0,
    ornaments: initial?.ornaments || 0,
    cookies: initial?.cookies || 0,
  }
}

export default function FestiveScoreCard({ initial, festive }) {
  const { locale, t } = useI18n()
  const [scores, setScores] = useState(() => ({ ...stored(initial), pending: false }))
  const [shown, setShown] = useState(Boolean(festive))

  useLayoutEffect(() => {
    const apply = () => {
      const live = festiveBook.snapshot()
      const base = stored(initial)
      setScores({
        ghosts: Math.max(base.ghosts, live.ghosts || 0),
        ornaments: Math.max(base.ornaments, live.ornaments || 0),
        cookies: Math.max(base.cookies, live.cookies || 0),
        pending: Boolean(live.pending),
      })
    }
    apply()
    return festiveBook.subscribe(apply)
  }, [initial])

  useLayoutEffect(() => {
    if (festiveOff()) setShown(false)
    return onFestiveChange((off) => setShown(!off))
  }, [])

  if (!shown) return null

  const visible = ROWS.filter((row) => (scores[row.id] || 0) > 0)
  if (!visible.length) return null

  const format = (value) => value.toLocaleString(intlLocale(locale))

  return (
    <section className="mt-6" aria-label={t('account.caughtTitle')}>
      <h2 className="m-0 text-sm font-semibold text-gray-400">{t('account.caughtTitle')}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {visible.map((row) => (
          <div key={row.id} className="inline-flex items-center gap-2.5 rounded-2xl bg-[var(--bg-primary)] px-3.5 py-2.5">
            <svg className="block h-4 w-4 shrink-0 text-modrinth-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={row.icon} />
            </svg>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase leading-none tracking-wide text-gray-500">{t(row.label)}</div>
              <div className="mt-1 text-lg font-extrabold leading-none tabular-nums text-white">{format(scores[row.id])}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="m-0 mt-3 text-xs leading-relaxed text-gray-500">
        {scores.pending ? t('account.caughtSaving') : t('account.caughtHint')}
      </p>
    </section>
  )
}
