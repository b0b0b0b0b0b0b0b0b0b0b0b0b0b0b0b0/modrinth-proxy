'use client'

import { useState } from 'react'
import StyledTooltip from './StyledTooltip'
import { useT } from './I18nProvider'

export default function CopyLabeledButton({
  text,
  label,
  copiedLabel,
  tooltipLabel,
}) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  const done = copiedLabel || t('copy.copied')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <StyledTooltip label={copied ? done : (tooltipLabel ?? label)}>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-modrinth-green dark:text-gray-300"
      >
        <span>{copied ? done : label}</span>
        {copied ? (
          <svg
            className="h-4 w-4 flex-shrink-0 text-modrinth-green"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg
            className="h-4 w-4 flex-shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
        )}
      </button>
    </StyledTooltip>
  )
}
