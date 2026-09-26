'use client'

import StyledTooltip from './StyledTooltip'
import { withReferralUtm } from '@/lib/referralUtm'
import { useT } from './I18nProvider'

function linkTooltipTarget(url) {
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`)
    const path = parsed.pathname.replace(/^\//, '').replace(/\/$/, '')
    if (path) return `${parsed.hostname}/${path}`
    return parsed.hostname
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

function hasGoToTooltip(link) {
  return ['discord', 'site', 'website', 'store', 'wiki'].includes(link.platform)
}

const linkButtonClassName =
  'flex gap-2 items-center w-fit text-gray-300 hover:text-white transition-colors text-sm leading-tight hover:underline bg-transparent border-0 p-0 cursor-pointer text-left font-inherit'

export default function ServerSidebarLink({ link, icon }) {
  const t = useT()
  const goToLabel = hasGoToTooltip(link) ? t('server.linkHost', { host: linkTooltipTarget(link.url) }) : link.name

  const control = (
    <button
      type="button"
      className={linkButtonClassName}
      aria-label={goToLabel}
      onClick={() => {
        const target = withReferralUtm(link.url)
        window.open(target, '_blank', 'noopener,noreferrer')
      }}
    >
      {icon}
      <span>{link.name}</span>
      <svg className="w-3 h-3 shrink-0 text-current opacity-60" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
      </svg>
    </button>
  )

  if (hasGoToTooltip(link)) {
    return <StyledTooltip label={goToLabel}>{control}</StyledTooltip>
  }

  return control
}
