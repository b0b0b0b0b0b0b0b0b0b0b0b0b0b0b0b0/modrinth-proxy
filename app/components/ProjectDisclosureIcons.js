export function DisclosureIcon({ type, className = 'w-6 h-6 shrink-0 mt-px' }) {
  const props = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    className,
    'aria-hidden': true,
  }

  switch (type) {
    case 'epilepsy_triggers':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'ai_content':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0zM20 3v4M22 5h-4M4 17v2M5 18H3" />
        </svg>
      )
    case 'advertisements':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
          <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14M8 6v8" />
        </svg>
      )
    case 'paid_features':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 18V6" />
        </svg>
      )
    case 'telemetry':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9M7.8 4.7a6.14 6.14 0 0 0-.8 7.5" />
          <circle cx="12" cy="9" r="2" />
          <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47M19.1 1.9a9.96 9.96 0 0 1 0 14.1M9.5 18h5M8 22l4-11 4 11" />
        </svg>
      )
    case 'system_interactions':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M11 9h4a2 2 0 0 0 2-2V3" />
          <circle cx="9" cy="9" r="2" />
          <path d="M7 21v-4a2 2 0 0 1 2-2h4" />
          <circle cx="15" cy="15" r="2" />
        </svg>
      )
    case 'derivative_work':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="18" r="3" />
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9M12 12v3" />
        </svg>
      )
    case 'license':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20M8 7h6M8 11h8" />
        </svg>
      )
    case 'published':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path stroke="currentColor" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2" />
        </svg>
      )
    case 'updated':
      return (
        <svg {...props} fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M1.05 12H7M17.01 12h5.95" />
        </svg>
      )
    default:
      return null
  }
}

export function ExternalLinkIcon({ className = 'inline w-3.5 h-3.5 ml-0.5 -mt-px' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
    </svg>
  )
}

export function ArchiveBannerIcon({ className = 'h-6 w-6 flex-none text-sky-400' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <rect width="20" height="5" x="2" y="4" rx="2" />
      <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9M10 13h4" />
    </svg>
  )
}
