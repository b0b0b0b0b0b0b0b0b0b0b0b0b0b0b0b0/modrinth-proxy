'use client'

import { useEffect, useState } from 'react'
import StyledTooltip from '../components/StyledTooltip'
import { useI18n } from '../components/I18nProvider'
import { intlLocale } from '@/lib/i18n/config'

const REFRESH_MS = 30 * 1000

export default function ModrinthTrafficChart({ initial }) {
  const { t, locale } = useI18n()
  const [data, setData] = useState(initial)

  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/api/st/modrinth', { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((next) => {
          if (alive && next?.minutes) setData(next)
        })
        .catch(() => {})
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  const { limit, minutes } = data
  const scale = Math.max(limit, ...minutes.map((minute) => minute.requests)) * 1.08
  const total = minutes.reduce((sum, minute) => sum + minute.requests, 0)
  const peak = Math.max(0, ...minutes.map((minute) => minute.requests))
  const limited = minutes.reduce((sum, minute) => sum + minute.limited, 0)
  const latest = [...minutes].reverse().find((minute) => minute.minRemaining !== null)
  const time = new Intl.DateTimeFormat(intlLocale(locale), { hour: '2-digit', minute: '2-digit' })

  const summary = [
    { value: total, label: t('st.mrTotal') },
    { value: peak, label: t('st.mrPeak'), warn: peak >= limit * 0.9 },
    { value: limited, label: t('st.mrLimited'), warn: limited > 0 },
    { value: latest ? latest.minRemaining : '—', label: t('st.mrRemaining'), warn: latest && latest.minRemaining < limit * 0.1 },
  ]

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-xl bg-gray-800/40 px-3 py-2">
            <div className={`text-lg font-bold tabular-nums ${item.warn ? 'text-red-400' : 'text-white'}`}>{item.value}</div>
            <div className="text-[11px] leading-snug text-gray-600 dark:text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="relative h-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-red-400/50"
          style={{ bottom: `${(limit / scale) * 100}%` }}
        >
          <span className="absolute -top-4 left-0 text-[10px] font-semibold text-red-400/80">{t('st.mrLimit', { n: limit })}</span>
        </div>
        <div role="img" aria-label={t('st.mrTitle')} className="flex h-full items-end gap-[2px]">
          {minutes.map((minute) => {
            const height = (minute.requests / scale) * 100
            const limitedShare = minute.requests ? minute.limited / minute.requests : 0
            const tip = t('st.mrTip', {
              time: time.format(new Date(minute.at)),
              n: minute.requests,
              limited: minute.limited,
              left: minute.minRemaining ?? '—',
            })
            return (
              <StyledTooltip key={minute.at} label={tip}>
                <div className="group flex h-full min-w-0 flex-1 cursor-default flex-col justify-end">
                  <div
                    className="flex w-full flex-col overflow-hidden rounded-sm"
                    style={{ height: `${Math.max(minute.requests ? 2 : 1, height)}%` }}
                  >
                    {minute.limited ? <div className="w-full bg-red-500" style={{ height: `${limitedShare * 100}%` }} /> : null}
                    <div className={`w-full flex-1 ${minute.requests ? 'bg-modrinth-green/70 group-hover:bg-modrinth-green' : 'bg-gray-800'}`} />
                  </div>
                </div>
              </StyledTooltip>
            )
          })}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-gray-600 dark:text-gray-500">
        <span>{time.format(new Date(minutes[0].at))}</span>
        <span>{time.format(new Date(minutes[minutes.length - 1].at))}</span>
      </div>
      {data.byKind?.length ? (
        <div className="mt-4 space-y-1.5">
          {data.byKind.map((row) => (
            <div key={row.kind} className="flex items-center gap-3 text-xs">
              <span className="w-40 shrink-0 truncate font-mono text-gray-400">{row.kind}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full rounded-full bg-modrinth-green/70" style={{ width: `${(row.n / data.byKind[0].n) * 100}%` }} />
              </div>
              <span className="w-24 shrink-0 text-right tabular-nums text-gray-300">
                {row.n} · {total ? Math.round((row.n / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <p className="mt-3 text-[11px] leading-relaxed text-gray-600 dark:text-gray-500">{t('st.mrHint')}</p>
    </div>
  )
}
