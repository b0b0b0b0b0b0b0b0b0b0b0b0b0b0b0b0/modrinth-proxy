'use client'

import StyledTooltip from './StyledTooltip'
import { useI18n, useT } from './I18nProvider'
import { intlLocale } from '@/lib/i18n/config'

function formatAbsolute(date, locale) {
  const tag = intlLocale(locale)
  return new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatRelative(dateString, t) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return date.toLocaleDateString()

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 60) return t('time.minutesAgo', { n: Math.max(1, diffMinutes) })
  if (diffHours < 24) return t('time.hoursAgo', { n: diffHours })
  if (diffDays === 1) return t('time.yesterday')
  if (diffDays < 7) return t('time.daysAgo', { n: diffDays })
  if (diffDays < 30) return t('time.weeksAgo', { n: Math.floor(diffDays / 7) })
  if (diffDays < 365) return t('time.monthsAgo', { n: Math.floor(diffDays / 30) })
  return t('time.yearsAgo', { n: Math.floor(diffDays / 365) })
}

export function formatRelativeRussian(dateString) {
  const t = (key, vars) => {
    const ru = {
      'time.minutesAgo': `${vars?.n} мин. назад`,
      'time.hoursAgo': `${vars?.n} ч. назад`,
      'time.yesterday': 'вчера',
      'time.daysAgo': `${vars?.n} дн. назад`,
      'time.weeksAgo': `${vars?.n} нед. назад`,
      'time.monthsAgo': `${vars?.n} мес. назад`,
      'time.yearsAgo': `${vars?.n} г. назад`,
    }
    return ru[key] || key
  }
  return formatRelative(dateString, t)
}

export default function RelativeTime({ dateString, className = '' }) {
  const t = useT()
  const { locale } = useI18n()
  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    return <span className={className}>{t('time.unknown')}</span>
  }

  const absolute = formatAbsolute(date, locale)
  const timeText = formatRelative(dateString, t) || t('time.unknown')
  const hintCls = `${className} cursor-help rounded-sm outline-none`.trim()

  return (
    <StyledTooltip label={absolute}>
      <span className={hintCls} tabIndex={0} aria-label={`${absolute}, ${timeText}`}>
        {timeText}
      </span>
    </StyledTooltip>
  )
}
