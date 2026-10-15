'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useI18n } from '../components/I18nProvider'
import { intlLocale } from '@/lib/i18n/config'

const TYPE_COLORS = {
  mod: 'bg-modrinth-green',
  resourcepack: 'bg-sky-500',
  plugin: 'bg-blue-500',
  shader: 'bg-violet-500',
  datapack: 'bg-amber-500',
  modpack: 'bg-red-500',
  minecraft_java_server: 'bg-teal-500',
}

export function DaysChart({ days, label }) {
  const { locale } = useI18n()
  const reduceMotion = useReducedMotion()
  const max = Math.max(1, ...days.map((day) => day.count))
  const format = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'numeric', timeZone: 'UTC' })

  return (
    <div role="img" aria-label={label} className="flex h-36 items-end gap-1 sm:gap-1.5">
      {days.map((day, index) => (
        <div key={day.date} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className={`text-[10px] font-bold tabular-nums ${day.count ? 'text-gray-400' : 'text-transparent'}`}>{day.count}</span>
          <motion.div
            initial={reduceMotion ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.03, ease: 'easeOut' }}
            style={{ height: `${Math.max(day.count ? 6 : 2, (day.count / max) * 100)}%`, transformOrigin: 'bottom' }}
            className={`w-full rounded-md ${day.count ? 'bg-modrinth-green/80 group-hover:bg-modrinth-green' : 'bg-gray-800'}`}
          />
          <span className={`text-[9px] tabular-nums text-gray-600 dark:text-gray-500 ${index % 2 ? 'max-sm:invisible' : ''}`}>
            {format.format(new Date(day.date))}
          </span>
        </div>
      ))}
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
            <span className="tabular-nums text-gray-600 dark:text-gray-500">{Math.round((row.n / total) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}
