'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { useI18n } from '../components/I18nProvider'
import { intlLocale } from '@/lib/i18n/config'
import { festiveBook } from '@/lib/festiveScoreClient'

const ROWS = [
  { id: 'ghosts', label: 'account.caughtGhosts' },
  { id: 'ornaments', label: 'account.caughtOrnaments' },
  { id: 'cookies', label: 'account.caughtCookies' },
]

export default function FestiveScoreCard() {
  const { locale, t } = useI18n()
  const [scores, setScores] = useState(null)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const apply = () => setScores(festiveBook.snapshot())
    apply()
    return festiveBook.subscribe(apply)
  }, [])

  useEffect(() => {
    let alive = true
    festiveBook.claim().finally(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])

  const total = (scores?.ghosts || 0) + (scores?.ornaments || 0) + (scores?.cookies || 0)
  if (!scores || (!ready && total === 0)) return null

  const format = (value) => value.toLocaleString(intlLocale(locale))

  return (
    <section className="mt-4 rounded-2xl card-glass bg-modrinth-dark px-4 py-3" aria-label={t('account.caughtTitle')}>
      <div className="grid grid-cols-3 gap-2">
        {ROWS.map((row) => (
          <div key={row.id} className="min-w-0">
            <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t(row.label)}</div>
            <div className="mt-0.5 text-lg font-bold tabular-nums text-white">{format(scores[row.id] || 0)}</div>
          </div>
        ))}
      </div>
      <p className="m-0 mt-2 text-xs leading-relaxed text-gray-500">
        {scores.pending ? t('account.caughtSaving') : t('account.caughtHint')}
      </p>
    </section>
  )
}
