'use client'

import * as Popover from '@radix-ui/react-popover'
import {
  formatLicenseFullName,
  formatLicenseShortLabel,
  getSpdxLicenseUrl,
} from '@/lib/license'

function ExternalIcon({ className = 'w-3 h-3' }) {
  return (
    <svg
      className={`inline shrink-0 opacity-60 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
    </svg>
  )
}

const linkClassName =
  'text-modrinth-green hover:underline cursor-pointer font-medium'

export default function LicenseLink({ license, className = '' }) {
  const label = formatLicenseShortLabel(license)
  if (!label) return null

  const customUrl =
    typeof license?.url === 'string' && /^https?:\/\//i.test(license.url.trim())
      ? license.url.trim()
      : null
  const fullName = formatLicenseFullName(license)
  const spdxUrl = getSpdxLicenseUrl(license?.id)

  if (customUrl) {
    return (
      <a
        href={customUrl}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className={`${linkClassName} ${className}`.trim()}
        title={fullName && fullName !== label ? fullName : undefined}
      >
        {label}
        <ExternalIcon className="w-3 h-3 ml-0.5 -mt-px" />
      </a>
    )
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`${linkClassName} bg-transparent border-0 p-0 text-left ${className}`.trim()}
        >
          {label}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={6}
          className="z-50 max-w-xs rounded-lg border border-gray-300 bg-white p-3 text-sm shadow-lg dark:border-gray-700 dark:bg-[#1a1b1e]"
        >
          {fullName && (
            <p className="m-0 mb-2 font-medium text-(--text-primary)">{fullName}</p>
          )}
          {license?.id && license.id !== label && (
            <p className="m-0 mb-2 text-xs text-(--text-gray)">{license.id}</p>
          )}
          {spdxUrl && (
            <a
              href={spdxUrl}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className="inline-flex items-center gap-1 text-xs text-modrinth-green hover:underline"
            >
              Полный текст лицензии
              <ExternalIcon />
            </a>
          )}
          <Popover.Arrow className="fill-white dark:fill-[#1a1b1e]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
