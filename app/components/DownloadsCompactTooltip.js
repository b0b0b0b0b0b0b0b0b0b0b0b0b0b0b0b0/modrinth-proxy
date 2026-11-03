'use client'

import StyledTooltip from './StyledTooltip'
import { formatDownloadsExactRu } from '@/lib/modrinth'

function shortDownloads(downloads) {
  const v = Number(downloads)
  if (!Number.isFinite(v)) return '0'
  const n = Math.max(0, Math.floor(v))
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(1)}k`
}

export default function DownloadsCompactTooltip({ downloads, className = '' }) {
  const v = Number(downloads)
  const safe = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
  const full = formatDownloadsExactRu(safe)
  const short = shortDownloads(safe)
  const label = `${full} загрузок`

  if (safe < 1000) {
    return <span className={className}>{short}</span>
  }

  return (
    <StyledTooltip label={label}>
      <span
        tabIndex={0}
        aria-label={label}
        className={`cursor-help rounded-xs outline-hidden ${className}`.trim()}
      >
        {short}
      </span>
    </StyledTooltip>
  )
}
