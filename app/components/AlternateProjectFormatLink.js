import Link from 'next/link'
import StyledTooltip from './StyledTooltip'

export default function AlternateProjectFormatLink({ href, tooltip, linkLabel }) {
  if (!href) return null

  return (
    <StyledTooltip label={tooltip}>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-modrinth-green hover:underline w-fit"
        aria-label={tooltip}
      >
        <svg
          className="h-4 w-4 shrink-0 opacity-80"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M16 3h5v5" />
          <path d="M8 3H3v5" />
          <path d="M12 22v-8.3a4 4 0 0 0 1.172-2.828L21 7" />
          <path d="m3 7 7.828 7.872A4 4 0 0 1 12 17.7V22" />
        </svg>
        {linkLabel}
      </Link>
    </StyledTooltip>
  )
}
