'use client'

import StyledTooltip from './StyledTooltip'

function formatAbsoluteRussian(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatRelativeRussian(dateString) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return date.toLocaleDateString('ru-RU')

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays === 1) return 'вчера'
  if (diffDays < 7) return `${diffDays} дн. назад`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} мес. назад`
  return `${Math.floor(diffDays / 365)} г. назад`
}

export default function RelativeTime({ dateString, className = '' }) {
  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    return <span className={className}>неизвестно</span>
  }

  const absolute = formatAbsoluteRussian(date)
  const timeText = formatRelativeRussian(dateString) || 'неизвестно'
  const hintCls = `${className} cursor-help rounded-sm outline-none`.trim()

  return (
    <StyledTooltip label={absolute}>
      <span className={hintCls} tabIndex={0} aria-label={`${absolute}, ${timeText}`}>
        {timeText}
      </span>
    </StyledTooltip>
  )
}
