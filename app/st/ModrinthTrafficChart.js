'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import StyledTooltip from '../components/StyledTooltip'
import CopyButton from '../components/CopyButton'
import CopyLabeledButton from '../components/CopyLabeledButton'
import { useI18n } from '../components/I18nProvider'
import { intlLocale } from '@/lib/i18n/config'

const REFRESH_MS = 30 * 1000
const KINDS_IN_ROW = 4

function kindsText(kinds, limit = KINDS_IN_ROW) {
  return (kinds || [])
    .slice(0, limit)
    .map((row) => `${row.kind} ${row.n}`)
    .join(', ')
}

function pct(share) {
  return Math.round((share || 0) * 100)
}

function reasonBits(t, source) {
  return (source.reasons || [])
    .filter((reason) => reason !== 'bot')
    .map((reason) => {
      if (reason === 'peak') return t('st.mrReasonPeak', { n: source.peak })
      if (reason === 'share') return t('st.mrReasonShare', { n: pct(source.share) })
      return ''
    })
    .filter(Boolean)
}

function whoText(t, source) {
  const reasons = reasonBits(t, source)
  if (source.ip === 'server') return [t('st.mrWhoServer'), ...reasons].filter(Boolean).join(' · ')
  const parts = []
  const users = source.users || []
  if (users.length) {
    parts.push(
      users
        .map((user) =>
          t('st.mrWhoUser', {
            name: user.username,
            id: user.id,
            fav: user.favorites,
            inst: user.installs,
          }) + (user.telegram ? ` · ${t('st.mrTelegramOn')}` : ''),
        )
        .join('; '),
    )
  } else {
    parts.push(source.expiredSessions ? t('st.mrWhoExpired') : t('st.mrWhoGuest'))
  }
  if (source.bot) parts.push(t('st.mrBot', { name: source.bot }))
  parts.push(...reasons)
  return parts.join(' · ')
}

function ReasonPills({ source, t }) {
  const labels = reasonBits(t, source)
  if (!labels.length) return null
  return labels.map((label) => (
    <span key={label} className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300">
      {label}
    </span>
  ))
}

function SourceBadge({ source, t }) {
  if (source.ip === 'server') {
    return (
      <span className="flex flex-wrap items-center gap-1">
        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-300">{t('st.mrWhoServer')}</span>
        <ReasonPills source={source} t={t} />
      </span>
    )
  }
  const users = source.users || []
  return (
    <span className="flex flex-wrap items-center gap-1">
      {source.bot ? (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">{t('st.mrBot', { name: source.bot })}</span>
      ) : null}
      <ReasonPills source={source} t={t} />
      {users.length ? (
        users.map((user) => (
          <span key={user.id} className="rounded-full bg-modrinth-green/15 px-2 py-0.5 text-[10px] font-bold text-modrinth-green">
            {user.username} #{user.id}
          </span>
        ))
      ) : (
        <span className="rounded-full bg-gray-700/60 px-2 py-0.5 text-[10px] font-bold text-gray-300">
          {source.expiredSessions ? t('st.mrWhoExpired') : t('st.mrWhoGuest')}
        </span>
      )}
    </span>
  )
}

function SourceRow({ source, index, t, time }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <li className="rounded-xl bg-gray-800/40 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="w-5 text-right font-bold tabular-nums text-gray-600 dark:text-gray-500">{index + 1}</span>
        {source.ip === 'server' || source.ip === '…' ? (
          <span className="font-mono font-medium text-white">{source.ip}</span>
        ) : (
          <CopyButton text={source.ip} tooltipLabel={t('st.mrCopyIp')} inline />
        )}
        <SourceBadge source={source} t={t} />
        <span className="ml-auto tabular-nums text-gray-300">
          {t('st.mrSourceCounts', { n: source.requests, limited: source.limited, pages: source.pathsCount })}
        </span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-gray-500 transition-colors hover:text-modrinth-green"
          aria-expanded={open}
        >
          {open ? t('st.mrHide') : t('st.mrMore')}
        </button>
      </div>
      {open ? (
        <div className="mt-2 space-y-1.5 border-t border-white/5 pt-2 text-gray-400">
          {(source.users || []).map((user) => (
            <div key={user.id}>
              {t('st.mrWhoUser', { name: user.username, id: user.id, fav: user.favorites, inst: user.installs })}
              {user.telegram ? ` · ${t('st.mrTelegramOn')}` : ''}
            </div>
          ))}
          <div>
            <span className="text-gray-600 dark:text-gray-500">{t('st.mrKinds')}: </span>
            {kindsText(source.kinds, 20)}
          </div>
          {source.prefetch ? (
            <div>
              <span className="text-gray-600 dark:text-gray-500">{t('st.mrPrefetch')}: </span>
              {source.prefetch}
            </div>
          ) : null}
          <div>
            <span className="text-gray-600 dark:text-gray-500">{t('st.mrMinutes')}: </span>
            {source.minutes.map((minute) => `${time.format(new Date(minute.at))} ${minute.n}`).join(', ')}
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-500">{t('st.mrPages')}:</div>
            <ul className="mt-0.5 space-y-0.5 font-mono">
              {source.paths.map((row) => (
                <li key={row.path} className="flex gap-2">
                  <span className="w-8 shrink-0 text-right tabular-nums text-gray-300">{row.n}</span>
                  <span className="min-w-0 break-all">{row.path}</span>
                </li>
              ))}
            </ul>
          </div>
          {source.uas.map((row) => (
            <div key={row.ua} className="break-all font-mono text-[11px]">
              <span className="text-gray-600 dark:text-gray-500">UA ×{row.n}: </span>
              {row.ua}
            </div>
          ))}
        </div>
      ) : null}
    </li>
  )
}

function groupWho(t, group) {
  return [group.bot ? t('st.mrBot', { name: group.bot }) : '', ...reasonBits(t, group)].filter(Boolean).join(' · ')
}

function GroupRow({ group, index, t, agent = false }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-xl bg-gray-800/40 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="w-5 text-right font-bold tabular-nums text-gray-600 dark:text-gray-500">{index + 1}</span>
        {agent ? (
          <span className="min-w-0 max-w-full flex-1 truncate font-mono text-[11px] text-white" title={group.key}>
            {group.key}
          </span>
        ) : (
          <CopyButton text={group.key} tooltipLabel={t('st.mrCopyIp')} inline />
        )}
        {group.bot ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">{t('st.mrBot', { name: group.bot })}</span>
        ) : null}
        <ReasonPills source={group} t={t} />
        <span className="ml-auto tabular-nums text-gray-300">
          {t('st.mrGroupCounts', {
            ips: group.ips,
            n: group.requests,
            limited: group.limited,
            peak: group.peak,
            share: pct(group.share),
          })}
        </span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-gray-500 transition-colors hover:text-modrinth-green"
          aria-expanded={open}
        >
          {open ? t('st.mrHide') : t('st.mrMore')}
        </button>
      </div>
      {open ? (
        <div className="mt-2 space-y-1.5 border-t border-white/5 pt-2 text-gray-400">
          {agent ? <div className="break-all font-mono text-[11px]">{group.key}</div> : null}
          <div>
            <span className="text-gray-600 dark:text-gray-500">{t('st.mrSampleIps')}: </span>
            <span className="font-mono">{group.sampleIps.join(', ')}</span>
          </div>
        </div>
      ) : null}
    </li>
  )
}

export default function ModrinthTrafficChart({ initial }) {
  const { t, locale } = useI18n()
  const [data, setData] = useState(initial)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(
    (minute) => {
      const query = minute == null ? '' : `?from=${minute}&to=${minute}`
      return fetch(`/api/st/modrinth${query}`, { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((next) => {
          if (next?.minutes) setData(next)
        })
        .catch(() => {})
    },
    [],
  )

  useEffect(() => {
    const timer = setInterval(() => load(selected), REFRESH_MS)
    return () => clearInterval(timer)
  }, [load, selected])

  const pick = (at) => {
    const next = selected === at ? null : at
    setSelected(next)
    setLoading(true)
    load(next).finally(() => setLoading(false))
  }

  const { limit, minutes } = data
  const scale = Math.max(limit, ...minutes.map((minute) => minute.requests)) * 1.08
  const total = minutes.reduce((sum, minute) => sum + minute.requests, 0)
  const peak = Math.max(0, ...minutes.map((minute) => minute.requests))
  const limited = minutes.reduce((sum, minute) => sum + minute.limited, 0)
  const latest = [...minutes].reverse().find((minute) => minute.minRemaining !== null)
  const time = useMemo(() => new Intl.DateTimeFormat(intlLocale(locale), { hour: '2-digit', minute: '2-digit' }), [locale])
  const date = useMemo(
    () => new Intl.DateTimeFormat(intlLocale(locale), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
    [locale],
  )
  const sources = data.sources || []
  const subnets = data.subnets || []
  const agents = data.agents || []
  const others = data.others || null
  const heavyTotal = data.heavyTotal ?? sources.length
  const rowsDesc = [...minutes].reverse().filter((minute) => minute.requests > 0)

  const summary = [
    { value: total, label: t('st.mrTotal') },
    { value: peak, label: t('st.mrPeak'), warn: peak >= limit * 0.9 },
    { value: limited, label: t('st.mrLimited'), warn: limited > 0 },
    { value: latest ? latest.minRemaining : '—', label: t('st.mrRemaining'), warn: latest && latest.minRemaining < limit * 0.1 },
  ]

  const minutesText = [
    `${t('st.mrTitle')} · ${date.format(new Date(minutes[0].at))} — ${date.format(new Date(minutes[minutes.length - 1].at))}`,
    [t('st.mrColTime'), t('st.mrColRequests'), '429', t('st.mrColLeft'), t('st.mrColSources'), t('st.mrColTop'), t('st.mrKinds')].join('\t'),
    ...rowsDesc.map((minute) =>
      [
        time.format(new Date(minute.at)),
        minute.requests,
        minute.limited,
        minute.minRemaining ?? '—',
        minute.sources,
        minute.top ? `${minute.top.ip} (${minute.top.n})` : '—',
        kindsText(minute.kinds, 20),
      ].join('\t'),
    ),
  ].join('\n')

  const rangeLabel = data.range ? time.format(new Date(data.range.from)) : t('st.mrWholeHour')
  const thresholds = data.thresholds || { peak: 30, share: 0.05, shareMinTotal: 300 }
  const listNote = t('st.mrListNote', {
    peak: thresholds.peak,
    share: pct(thresholds.share),
    min: thresholds.shareMinTotal,
  })
  const groupBlock = (group) =>
    [
      `${group.key}${groupWho(t, group) ? ` — ${groupWho(t, group)}` : ''}`,
      `   ${t('st.mrGroupCounts', { ips: group.ips, n: group.requests, limited: group.limited, peak: group.peak, share: pct(group.share) })}`,
      `   ${t('st.mrSampleIps')}: ${group.sampleIps.join(', ')}`,
    ].join('\n')
  const sourcesText = [
    `${t('st.mrSourcesTitle')} · ${data.range ? date.format(new Date(data.range.from)) : t('st.mrWholeHour')} · ${t('st.mrHeavyTotal', { n: heavyTotal })} · ${t('st.mrSourcesTotal', { n: data.sourcesTotal ?? sources.length })}`,
    ...sources.map((source, index) =>
      [
        `#${index + 1} ${source.ip} — ${whoText(t, source)}`,
        `   ${t('st.mrSourceCounts', { n: source.requests, limited: source.limited, pages: source.pathsCount })}${source.prefetch ? ` · ${t('st.mrPrefetch')}: ${source.prefetch}` : ''}`,
        `   ${t('st.mrKinds')}: ${kindsText(source.kinds, 20)}`,
        `   ${t('st.mrMinutes')}: ${source.minutes.map((minute) => `${time.format(new Date(minute.at))} ${minute.n}`).join(', ')}`,
        `   ${t('st.mrPages')}: ${source.paths.map((row) => `${row.path} ${row.n}`).join(', ')}`,
        ...source.uas.map((row) => `   UA ×${row.n}: ${row.ua}`),
      ].join('\n'),
    ),
    subnets.length ? `\n${t('st.mrSubnets')}\n${subnets.map(groupBlock).join('\n')}` : '',
    agents.length ? `\n${t('st.mrAgents')}\n${agents.map(groupBlock).join('\n')}` : '',
    others?.count
      ? `\n${t('st.mrOthers', { count: others.count, n: others.requests, limited: others.limited, share: pct(others.share) })}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

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
            const active = selected === minute.at
            const tip = t('st.mrTip', {
              time: time.format(new Date(minute.at)),
              n: minute.requests,
              limited: minute.limited,
              left: minute.minRemaining ?? '—',
            })
            return (
              <StyledTooltip key={minute.at} label={tip}>
                <button
                  type="button"
                  onClick={() => pick(minute.at)}
                  className={`group flex h-full min-w-0 flex-1 flex-col justify-end rounded-sm ${active ? 'bg-white/10' : ''}`}
                >
                  <div
                    className="flex w-full flex-col overflow-hidden rounded-sm"
                    style={{ height: `${Math.max(minute.requests ? 2 : 1, height)}%` }}
                  >
                    {minute.limited ? <div className="w-full bg-red-500" style={{ height: `${limitedShare * 100}%` }} /> : null}
                    <div
                      className={`w-full flex-1 ${
                        minute.requests ? (active ? 'bg-modrinth-green' : 'bg-modrinth-green/70 group-hover:bg-modrinth-green') : 'bg-gray-800'
                      }`}
                    />
                  </div>
                </button>
              </StyledTooltip>
            )
          })}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-gray-600 dark:text-gray-500">
        <span>{time.format(new Date(minutes[0].at))}</span>
        <span>{t('st.mrClickHint')}</span>
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

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">{t('st.mrMinutesTitle')}</h3>
          <CopyLabeledButton text={minutesText} label={t('st.mrCopyText')} />
        </div>
        <div className="max-h-80 overflow-auto rounded-xl bg-gray-800/30">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="sticky top-0 bg-modrinth-dark text-[10px] uppercase text-gray-600 dark:text-gray-500">
              <tr>
                <th className="px-2 py-1.5">{t('st.mrColTime')}</th>
                <th className="px-2 py-1.5 text-right">{t('st.mrColRequests')}</th>
                <th className="px-2 py-1.5 text-right">429</th>
                <th className="px-2 py-1.5 text-right">{t('st.mrColLeft')}</th>
                <th className="px-2 py-1.5 text-right">{t('st.mrColSources')}</th>
                <th className="px-2 py-1.5">{t('st.mrColTop')}</th>
                <th className="hidden px-2 py-1.5 sm:table-cell">{t('st.mrKinds')}</th>
              </tr>
            </thead>
            <tbody>
              {rowsDesc.map((minute) => (
                <tr
                  key={minute.at}
                  onClick={() => pick(minute.at)}
                  className={`cursor-pointer border-t border-white/5 transition-colors hover:bg-white/5 ${
                    selected === minute.at ? 'bg-modrinth-green/10' : ''
                  }`}
                >
                  <td className="px-2 py-1 text-gray-300">{time.format(new Date(minute.at))}</td>
                  <td className={`px-2 py-1 text-right ${minute.requests >= limit ? 'font-bold text-red-400' : 'text-white'}`}>{minute.requests}</td>
                  <td className={`px-2 py-1 text-right ${minute.limited ? 'font-bold text-red-400' : 'text-gray-500'}`}>{minute.limited}</td>
                  <td className="px-2 py-1 text-right text-gray-400">{minute.minRemaining ?? '—'}</td>
                  <td className="px-2 py-1 text-right text-gray-400">{minute.sources}</td>
                  <td className="px-2 py-1 font-mono text-gray-300">{minute.top ? `${minute.top.ip} (${minute.top.n})` : '—'}</td>
                  <td className="hidden px-2 py-1 text-gray-500 sm:table-cell">{kindsText(minute.kinds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">
            {t('st.mrSourcesTitle')} · {rangeLabel} · {t('st.mrHeavyTotal', { n: heavyTotal })} · {t('st.mrSourcesTotal', { n: data.sourcesTotal ?? sources.length })}
            {loading ? ' …' : ''}
          </h3>
          <div className="flex items-center gap-4">
            {selected != null ? (
              <button type="button" onClick={() => pick(selected)} className="text-sm text-gray-500 transition-colors hover:text-modrinth-green">
                {t('st.mrWholeHour')}
              </button>
            ) : null}
            <CopyLabeledButton text={sourcesText} label={t('st.mrCopyText')} />
          </div>
        </div>
        {(data.sourcesTotal ?? 0) > 0 || sources.length || subnets.length || agents.length ? (
          <p className="mb-2 text-[11px] leading-relaxed text-gray-600 dark:text-gray-500">{listNote}</p>
        ) : null}
        {sources.length ? (
          <ol className="space-y-1.5">
            {sources.map((source, index) => (
              <SourceRow key={`${data.range?.from ?? 'all'}:${source.ip}`} source={source} index={index} t={t} time={time} />
            ))}
          </ol>
        ) : !subnets.length && !agents.length ? (
          <p className="text-xs text-gray-600 dark:text-gray-500">
            {(data.sourcesTotal ?? 0) > 0 || others?.count ? t('st.mrNoHeavy') : t('st.mrNoSources')}
          </p>
        ) : null}
        {subnets.length ? (
          <div className="mt-4">
            <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">{t('st.mrSubnets')}</h4>
            <ol className="space-y-1.5">
              {subnets.map((group, index) => (
                <GroupRow key={group.key} group={group} index={index} t={t} />
              ))}
            </ol>
          </div>
        ) : null}
        {agents.length ? (
          <div className="mt-4">
            <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">{t('st.mrAgents')}</h4>
            <ol className="space-y-1.5">
              {agents.map((group, index) => (
                <GroupRow key={group.key} group={group} index={index} t={t} agent />
              ))}
            </ol>
          </div>
        ) : null}
        {others?.count ? (
          <p className="mt-3 text-xs text-gray-500">
            {t('st.mrOthers', { count: others.count, n: others.requests, limited: others.limited, share: pct(others.share) })}
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-gray-600 dark:text-gray-500">{t('st.mrHint')}</p>
    </div>
  )
}
