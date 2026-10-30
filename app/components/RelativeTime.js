'use client'

import StyledTooltip from './StyledTooltip'
import { useI18n, useT } from './I18nProvider'
import { intlLocale } from '@/lib/i18n/config'

export function formatAbsolute(dateString, locale) {
  const date = dateString instanceof Date ? dateString : new Date(dateString)
  if (isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: 'long',
    timeStyle: 'medium',
  }).format(date)
}

export function formatRelative(dateString, t, locale) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return formatAbsolute(date, locale)

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 60) return t('time.minutesAgo', { n: Math.max(1, diffMinutes) })
  if (diffHours < 24) return t('time.hoursAgo', { n: diffHours })
  if (diffDays === 1) return t('time.yesterday')
  if (diffDays < 7) return t('time.daysAgo', { n: diffDays })
  if (diffDays < 30) return t('time.weeksAgo', { n: Math.floor(diffDays / 7) })
  if (diffDays < 365) return t('time.monthsAgo', { n: Math.floor(diffDays / 30) })
  const years = Math.floor(diffDays / 365)
  const mod10 = years % 10
  const mod100 = years % 100
  const isMany = (mod100 >= 11 && mod100 <= 19) || mod10 === 0 || mod10 >= 5
  return t(isMany ? 'time.yearsAgoMany' : 'time.yearsAgo', { n: years })
}

export default function RelativeTime({ dateString, className = '' }) {
  const t = useT()
  const { locale } = useI18n()
  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    return <span className={className}>{t('time.unknown')}</span>
  }

  const absolute = formatAbsolute(date, locale)
  const timeText = formatRelative(dateString, t, locale) || t('time.unknown')
  const hintCls = `${className} cursor-help rounded-sm outline-none`.trim()

  return (
    <StyledTooltip label={absolute}>
      <span className={hintCls} tabIndex={0} aria-label={`${absolute}, ${timeText}`}>
        {timeText}
      </span>
    </StyledTooltip>
  )
}
