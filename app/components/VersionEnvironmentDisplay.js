'use client'

import StyledTooltip from './StyledTooltip'
import { IconHardDrive } from '@/lib/icons'
import { formatVersionEnvironment } from '@/lib/modrinth'

function envKey(environment) {
  if (environment == null || environment === '') return ''
  return String(environment).toLowerCase().replace(/\s+/g, '_')
}

export default function VersionEnvironmentDisplay({
  environment,
  className = '',
  compactTableColumn = false,
}) {
  const label = formatVersionEnvironment(environment)
  const key = envKey(environment)
  const base = `min-w-0 ${className}`.trim()
  const col =
    compactTableColumn ? 'w-full max-w-17 truncate text-center' : ''

  const textBody = compactTableColumn
    ? `${base} w-full max-w-17 text-xs font-medium text-gray-400 truncate text-center`.trim()
    : className.includes('text-')
      ? base
      : `${base} text-xs font-medium text-gray-400 line-clamp-2`.trim()

  if (environment == null || environment === '') {
    return (
      <span className={[base, col].filter(Boolean).join(' ')}>—</span>
    )
  }

  if (key === 'unknown') {
    return (
      <span
        className={`${base} text-xs text-gray-500 ${col}`.trim()}
        title={compactTableColumn ? label : undefined}
      >
        {label}
      </span>
    )
  }

  if (key === 'dedicated_server_only') {
    return (
      <StyledTooltip label={label}>
        <button
          type="button"
          className={`inline-flex cursor-help items-center justify-center rounded-sm border-0 bg-transparent p-0 text-inherit outline-hidden hover:opacity-90 focus-visible:ring-2 focus-visible:ring-modrinth-green focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-primary) ${base} ${compactTableColumn ? 'mx-auto flex' : ''}`.trim()}
          aria-label={label}
        >
          <IconHardDrive className="h-4 w-4 shrink-0 text-current" aria-hidden />
        </button>
      </StyledTooltip>
    )
  }

  return (
    <span className={textBody} title={label}>
      {label}
    </span>
  )
}
