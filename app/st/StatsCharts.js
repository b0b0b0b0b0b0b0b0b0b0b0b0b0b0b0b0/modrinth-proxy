'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useI18n } from '../components/I18nProvider'
import { intlLocale } from '@/lib/i18n/config'
import StyledTooltip from '../components/StyledTooltip'

const TYPE_COLORS = {
  mod: 'bg-modrinth-green',
  resourcepack: 'bg-sky-500',
  plugin: 'bg-blue-500',
  shader: 'bg-violet-500',
  datapack: 'bg-amber-500',
  modpack: 'bg-red-500',
  minecraft_java_server: 'bg-teal-500',
  modrinth: 'bg-modrinth-green',
  astral: 'bg-violet-500',
  windows: 'bg-sky-500',
  macos: 'bg-gray-300',
  linux: 'bg-amber-500',
  exe: 'bg-sky-500',
  msi: 'bg-blue-500',
  dmg: 'bg-gray-300',
  flathub: 'bg-modrinth-green',
  appimage: 'bg-amber-500',
  deb: 'bg-red-500',
  rpm: 'bg-rose-400',
  hero: 'bg-modrinth-green',
  card: 'bg-sky-500',
  files: 'bg-violet-500',
}

function isWeekend(date) {
  const weekday = new Date(date).getUTCDay()
  return weekday === 0 || weekday === 6
}

function average(list) {
  return list.length ? Math.round(list.reduce((sum, day) => sum + day.count, 0) / list.length) : 0
}

function barClass(day, weekend, today) {
  if (!day.count) return 'bg-gray-800'
  if (today) return 'border border-dashed border-modrinth-green bg-modrinth-green/25 group-hover:bg-modrinth-green/40'
  if (weekend) return 'bg-amber-400/75 group-hover:bg-amber-400'
  return 'bg-modrinth-green/80 group-hover:bg-modrinth-green'
}

export function DaysChart({ days, label }) {
  const { t, locale } = useI18n()
  const reduceMotion = useReducedMotion()
  const max = Math.max(1, ...days.map((day) => day.count))
  const lang = intlLocale(locale)
  const dateFormat = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'numeric', timeZone: 'UTC' })
  const weekdayFormat = new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' })
  const fullFormat = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  const thousands = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 })
  const short = (n) => (n >= 1000 ? `${thousands.format(n >= 10000 ? Math.round(n / 1000) : n / 1000)}k` : String(n))
  const whole = new Intl.NumberFormat(lang)
  const lastIndex = days.length - 1
  const firstCounted = days.findIndex((day) => day.count > 0)
  const finished = firstCounted < 0 ? [] : days.slice(firstCounted + 1, lastIndex)
  const weekdayAvg = average(finished.filter((day) => !isWeekend(day.date)))
  const weekendAvg = average(finished.filter((day) => isWeekend(day.date)))
  const showSummary = finished.some((day) => isWeekend(day.date)) && finished.some((day) => !isWeekend(day.date))

  return (
    <div>
      <div role="img" aria-label={label} className="flex h-40 items-end">
        {days.map((day, index) => {
          const weekend = isWeekend(day.date)
          const today = index === lastIndex
          const monday = new Date(day.date).getUTCDay() === 1 && index > 0
          return (
            <div
              key={day.date}
              className={`flex h-full min-w-0 flex-1 ${monday ? 'ml-1.5 border-l border-gray-800 pl-1.5 sm:ml-2 sm:pl-2' : 'ml-0.5 sm:ml-1'} first:ml-0`}
            >
              <StyledTooltip
                label={
                  <span className="block text-center">
                    <span className="block font-bold tabular-nums">{whole.format(day.count)}</span>
                    <span className="block capitalize">{fullFormat.format(new Date(day.date))}</span>
                    {today ? <span className="block opacity-70">{t('st.chartTodayPartial')}</span> : null}
                  </span>
                }
              >
                <div className="group flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end gap-1">
                  <span className={`text-[10px] font-bold tabular-nums ${day.count ? 'text-gray-400' : 'text-transparent'}`}>
                    {short(day.count)}
                  </span>
                  <motion.div
                    initial={reduceMotion ? false : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.03, ease: 'easeOut' }}
                    style={{ height: `${Math.max(day.count ? 6 : 2, (day.count / max) * 100)}%`, transformOrigin: 'bottom' }}
                    className={`w-full rounded-md transition-colors ${barClass(day, weekend, today)}`}
                  />
                  <span
                    className={`text-[9px] font-semibold uppercase leading-none ${
                      today ? 'text-modrinth-green' : weekend ? 'text-amber-400' : 'text-gray-600 dark:text-gray-500'
                    }`}
                  >
                    {weekdayFormat.format(new Date(day.date)).replace('.', '')}
                  </span>
                  <span className={`text-[9px] leading-none tabular-nums text-gray-600 dark:text-gray-500 ${index % 2 ? 'max-sm:invisible' : ''}`}>
                    {dateFormat.format(new Date(day.date))}
                  </span>
                </div>
              </StyledTooltip>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-modrinth-green" />
          {t('st.chartWeekdays')}
          {showSummary ? <span className="tabular-nums text-gray-600 dark:text-gray-500">{t('st.chartAvg', { n: whole.format(weekdayAvg) })}</span> : null}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          {t('st.chartWeekends')}
          {showSummary ? <span className="tabular-nums text-gray-600 dark:text-gray-500">{t('st.chartAvg', { n: whole.format(weekendAvg) })}</span> : null}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-dashed border-modrinth-green" />
          {t('st.chartToday')}
        </span>
      </div>
    </div>
  )
}

export function TypeSplit({ title, rows, labels }) {
  const reduceMotion = useReducedMotion()
  const total = rows.reduce((sum, row) => sum + row.n, 0)
  if (total === 0) return null

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-xs font-semibold text-gray-400">
        <span>{title}</span>
        <span className="tabular-nums text-gray-600 dark:text-gray-500">{total}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-800">
        {rows.map((row, index) => (
          <motion.div
            key={row.type}
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${(row.n / total) * 100}%` }}
            transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.15 + index * 0.05, ease: 'easeOut' }}
            className={`${TYPE_COLORS[row.type] || 'bg-gray-500'} h-full`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {rows.map((row) => (
          <span key={row.type} className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className={`h-2 w-2 rounded-full ${TYPE_COLORS[row.type] || 'bg-gray-500'}`} />
            {labels[row.type] || row.type}
            <span className="font-bold tabular-nums text-white">{row.n}</span>
            <span className="tabular-nums text-gray-600 dark:text-gray-500">{Math.round((row.n / total) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}
