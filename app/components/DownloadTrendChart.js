'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useI18n } from './I18nProvider'
import { intlLocale } from '@/lib/i18n/config'

const PERIODS = [7, 30, 90]
const CHART_HEIGHT = 220
const MARGIN = { top: 12, right: 8, bottom: 24, left: 60 }

function niceStep(raw) {
  const power = 10 ** Math.floor(Math.log10(raw))
  const n = raw / power
  const factor = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return Math.max(1, factor * power)
}

function buildScale(maxValue) {
  const step = niceStep(Math.max(maxValue, 1) / 4)
  const max = Math.max(step, step * Math.ceil(maxValue / step))
  const ticks = []
  for (let value = 0; value <= max + step / 2; value += step) ticks.push(value)
  return { max, ticks }
}

function movingAverage(days) {
  return days.map((_, index) => {
    if (index === days.length - 1) return null
    const window = days
      .slice(Math.max(0, index - 6), index + 1)
      .filter((day) => day.value !== null && !day.partial)
    if (window.length < 4) return null
    return window.reduce((sum, day) => sum + day.value, 0) / window.length
  })
}

function Tile({ label, value, hint, accent }) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-800 bg-[var(--bg-primary)] px-3 py-2">
      <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="truncate text-base font-bold text-white">{value}</span>
        {accent}
      </div>
      {hint ? <div className="mt-0.5 truncate text-[11px] text-gray-500">{hint}</div> : null}
    </div>
  )
}

function LegendItem({ children, swatch }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
      {swatch}
      {children}
    </span>
  )
}

export default function DownloadTrendChart({ trend }) {
  const { t, locale } = useI18n()
  const hatchId = useId()
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(720)
  const [hover, setHover] = useState(null)

  const all = trend.days
  const complete = all.slice(0, -1)
  const today = all[all.length - 1]
  const firstKnown = complete.findIndex((day) => day.value !== null)
  const span = firstKnown === -1 ? 0 : complete.length - firstKnown

  const enabledPeriods = PERIODS.filter((p, index) => index === 0 || span > PERIODS[index - 1])
  const [period, setPeriod] = useState(enabledPeriods.includes(30) ? 30 : 7)

  useEffect(() => {
    const node = wrapRef.current
    if (!node) return undefined
    const update = () => setWidth(Math.max(280, Math.floor(node.clientWidth)))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const formats = useMemo(() => {
    const tag = intlLocale(locale)
    return {
      compact: new Intl.NumberFormat(tag, { notation: 'compact', maximumFractionDigits: 1 }),
      exact: new Intl.NumberFormat(tag),
      axisDate: new Intl.DateTimeFormat(tag, { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
      fullDate: new Intl.DateTimeFormat(tag, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }),
      since: new Intl.DateTimeFormat(tag, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    }
  }, [locale])

  const model = useMemo(() => {
    const complete = all.slice(0, -1)
    const shown = Math.min(period, complete.length)
    const offset = all.length - 1 - shown
    const view = all.slice(offset)
    const average = movingAverage(all).slice(offset)
    const current = view.slice(0, -1)
    const known = current.filter((day) => day.value !== null)
    const sum = known.reduce((total, day) => total + day.value, 0)
    const avg = known.length ? sum / known.length : null
    const peak = known.reduce((best, day) => (!best || day.value > best.value ? day : best), null)

    let change = null
    const previous = complete.slice(-2 * period, -period).filter((day) => day.value !== null)
    if (
      complete.length >= 2 * period &&
      previous.length >= period * 0.9 &&
      known.length >= period * 0.9
    ) {
      const previousAvg = previous.reduce((total, day) => total + day.value, 0) / previous.length
      if (previousAvg > 0) change = (avg - previousAvg) / previousAvg
    }

    const follows = view.reduce((total, day) => total + (day.follows ?? 0), 0)
    const hasFollows = view.some((day) => day.follows !== null)
    const highest = Math.max(
      0,
      ...view.map((day) => day.value ?? 0),
      ...average.map((value) => value ?? 0),
    )

    return {
      view,
      average,
      shown,
      known: known.length,
      sum,
      avg,
      peak,
      change,
      follows: hasFollows ? follows : null,
      scale: buildScale(highest),
      hasEstimate: view.some((day) => day.est),
    }
  }, [all, period])

  const dayDate = (day) => new Date(`${day.date}T00:00:00Z`)
  const sinceLabel = formats.since.format(new Date(trend.since))
  const signed = (value) => `${value > 0 ? '+' : ''}${formats.exact.format(value)}`

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-bold text-white">{t('trend.title')}</h2>
      <div className="inline-flex rounded-lg border border-gray-800 p-0.5">
        {PERIODS.map((p) => {
          const enabled = enabledPeriods.includes(p)
          const active = p === period
          return (
            <button
              key={p}
              type="button"
              disabled={!enabled}
              onClick={() => setPeriod(p)}
              aria-pressed={active}
              className={[
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                active
                  ? 'bg-modrinth-green text-black'
                  : enabled
                    ? 'text-gray-400 hover:text-white'
                    : 'cursor-not-allowed text-gray-600 opacity-50',
              ].join(' ')}
            >
              {t('trend.period', { n: p })}
            </button>
          )
        })}
      </div>
    </div>
  )

  const todayTile = (
    <Tile
      label={t('trend.today')}
      value={today.value === null ? '—' : `+${formats.compact.format(today.value)}`}
      hint={
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-modrinth-green opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-modrinth-green" />
          </span>
          {t('trend.todayLive')}
        </span>
      }
    />
  )

  if (model.known === 0) return null

  const { view, average, scale } = model
  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom
  const slot = innerWidth / view.length
  const barWidth = Math.min(28, Math.max(2, slot * 0.72))
  const centerX = (index) => MARGIN.left + slot * index + slot / 2
  const y = (value) => MARGIN.top + innerHeight * (1 - value / scale.max)
  const baseline = MARGIN.top + innerHeight

  const averageSegments = []
  let segment = []
  average.forEach((value, index) => {
    if (value === null) {
      if (segment.length > 1) averageSegments.push(segment)
      segment = []
      return
    }
    segment.push(`${centerX(index).toFixed(1)},${y(value).toFixed(1)}`)
  })
  if (segment.length > 1) averageSegments.push(segment)

  const labelEvery = Math.max(1, Math.ceil(view.length / Math.max(2, Math.floor(innerWidth / 64))))
  const hovered = hover === null ? null : view[hover]
  const hoveredAverage = hover === null ? null : average[hover]

  const handlePointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left - MARGIN.left
    const index = Math.floor(x / slot)
    setHover(index >= 0 && index < view.length ? index : null)
  }

  const noteFor = (day, isToday) => {
    if (day.value === null) return t('trend.tipNone')
    if (isToday) return t('trend.tipToday')
    if (day.partial) return t('trend.tipPartial')
    if (day.est) return t('trend.tipEst')
    return ''
  }

  return (
    <section
      className="mb-6 rounded-lg border border-gray-800 bg-modrinth-dark p-4 md:p-6"
      aria-label={t('trend.title')}
    >
      {header}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile
          label={t('trend.sum', { n: model.shown })}
          value={formats.compact.format(model.sum)}
          accent={
            model.change === null ? null : (
              <span
                title={t('trend.vsPrev', { n: period })}
                className={[
                  'shrink-0 rounded px-1 text-[11px] font-semibold',
                  model.change >= 0
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400',
                ].join(' ')}
              >
                {model.change >= 0 ? '▲' : '▼'} {Math.abs(Math.round(model.change * 100))}%
              </span>
            )
          }
          hint={model.change === null ? null : t('trend.vsPrev', { n: period })}
        />
        <Tile label={t('trend.avg')} value={formats.compact.format(Math.round(model.avg))} />
        <Tile
          label={t('trend.peak')}
          value={formats.compact.format(model.peak.value)}
          hint={formats.fullDate.format(dayDate(model.peak))}
        />
        {todayTile}
      </div>

      <div ref={wrapRef} className="relative mt-4 select-none">
        <svg
          width="100%"
          height={CHART_HEIGHT}
          viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="block touch-pan-y text-gray-500"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setHover(null)}
          aria-hidden
        >
          <defs>
            <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--color-green)" fillOpacity="0.25" />
              <rect width="3" height="6" fill="var(--color-green)" fillOpacity="0.75" />
            </pattern>
          </defs>

          {scale.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="currentColor"
                strokeOpacity={tick === 0 ? 0.5 : 0.18}
              />
              <text
                x={MARGIN.left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                fontSize="11"
                fill="var(--text-muted)"
              >
                {formats.compact.format(tick)}
              </text>
            </g>
          ))}

          {hover !== null ? (
            <rect
              x={MARGIN.left + slot * hover}
              y={MARGIN.top}
              width={slot}
              height={innerHeight}
              fill="currentColor"
              fillOpacity="0.12"
            />
          ) : null}

          {view.map((day, index) => {
            const isToday = index === view.length - 1
            const x = centerX(index) - barWidth / 2
            if (day.value === null) {
              return (
                <rect
                  key={day.date}
                  x={x}
                  y={MARGIN.top}
                  width={barWidth}
                  height={innerHeight}
                  fill="currentColor"
                  fillOpacity="0.06"
                />
              )
            }
            const top = Math.min(y(day.value), baseline - 1)
            return (
              <rect
                key={day.date}
                x={x}
                y={top}
                width={barWidth}
                height={baseline - top}
                rx={Math.min(2, barWidth / 2)}
                fill={isToday ? `url(#${hatchId})` : 'var(--color-green)'}
                fillOpacity={isToday ? 1 : day.est || day.partial ? 0.4 : hover === index ? 1 : 0.85}
                stroke={day.est && !isToday ? 'var(--color-green)' : 'none'}
                strokeDasharray="3 2"
              />
            )
          })}

          {averageSegments.map((points) => (
            <polyline
              key={points[0]}
              points={points.join(' ')}
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {hover !== null && hoveredAverage !== null ? (
            <circle
              cx={centerX(hover)}
              cy={y(hoveredAverage)}
              r="3.5"
              fill="var(--text-secondary)"
              stroke="var(--bg-primary)"
              strokeWidth="1.5"
            />
          ) : null}

          {view.map((day, index) =>
            (view.length - 1 - index) % labelEvery === 0 ? (
              <text
                key={day.date}
                x={centerX(index)}
                y={CHART_HEIGHT - 6}
                textAnchor="middle"
                fontSize="11"
                fill="var(--text-muted)"
              >
                {formats.axisDate.format(dayDate(day))}
              </text>
            ) : null,
          )}
        </svg>

        {hovered ? (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max max-w-[16rem] -translate-x-1/2 rounded-lg border border-gray-700 bg-[var(--bg-primary)] px-3 py-2 text-xs shadow-lg"
            style={{ left: Math.min(width - 96, Math.max(96, centerX(hover))) }}
          >
            <div className="font-semibold text-white">{formats.fullDate.format(dayDate(hovered))}</div>
            <div className="mt-1 flex items-center justify-between gap-4 text-gray-400">
              <span>{t('trend.tipDownloads')}</span>
              <span className="font-mono font-semibold text-white">
                {hovered.value === null ? '—' : formats.exact.format(hovered.value)}
              </span>
            </div>
            {hoveredAverage !== null ? (
              <div className="flex items-center justify-between gap-4 text-gray-400">
                <span>{t('trend.tipAvg')}</span>
                <span className="font-mono text-gray-200">
                  {formats.exact.format(Math.round(hoveredAverage))}
                </span>
              </div>
            ) : null}
            {noteFor(hovered, hover === view.length - 1) ? (
              <div className="mt-1 whitespace-normal text-[11px] leading-snug text-gray-500">
                {noteFor(hovered, hover === view.length - 1)}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <LegendItem swatch={<span className="h-2.5 w-2.5 rounded-sm bg-modrinth-green" />}>
          {t('trend.legendDay')}
        </LegendItem>
        <LegendItem
          swatch={<span className="h-0.5 w-4 rounded-full" style={{ background: 'var(--text-secondary)' }} />}
        >
          {t('trend.legendAvg')}
        </LegendItem>
        <LegendItem
          swatch={
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                background:
                  'repeating-linear-gradient(45deg, var(--color-green) 0 2px, transparent 2px 4px)',
              }}
            />
          }
        >
          {t('trend.legendToday')}
        </LegendItem>
        {model.hasEstimate ? (
          <LegendItem
            swatch={<span className="h-2.5 w-2.5 rounded-sm border border-dashed border-modrinth-green bg-modrinth-green/40" />}
          >
            {t('trend.legendEst')}
          </LegendItem>
        ) : null}
        {model.follows !== null ? (
          <span className="ml-auto text-[11px] text-gray-400">
            {t('trend.follows', { v: signed(model.follows) })}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
        {t('trend.note', { date: sinceLabel })}
        {model.known < model.shown
          ? ` ${t('trend.coverage', { have: model.known, total: model.shown })}`
          : ''}
      </p>

      <div className="sr-only">
        <table>
          <caption>{t('trend.tableCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('trend.colDate')}</th>
              <th scope="col">{t('trend.colDownloads')}</th>
              <th scope="col">{t('trend.colNote')}</th>
            </tr>
          </thead>
          <tbody>
            {view.map((day, index) => (
              <tr key={day.date}>
                <th scope="row">{day.date}</th>
                <td>{day.value === null ? '—' : formats.exact.format(day.value)}</td>
                <td>{noteFor(day, index === view.length - 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
