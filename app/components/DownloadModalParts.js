'use client'

import StyledTooltip from './StyledTooltip'

const VERSION_TYPE_LABELS = {
  release: 'Release',
  beta: 'Beta',
  alpha: 'Alpha',
}

const VERSION_TYPE_STYLES = {
  release: 'bg-version-release-bg text-version-release-fg border-version-release-fg/30',
  beta: 'bg-version-beta-bg text-version-beta-fg border-version-beta-fg/30',
  alpha: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export function VersionChannelBadge({ versionType = 'release' }) {
  const type = versionType || 'release'
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-sm font-normal leading-none ${
        VERSION_TYPE_STYLES[type] || VERSION_TYPE_STYLES.release
      }`}
    >
      {VERSION_TYPE_LABELS[type] || VERSION_TYPE_LABELS.release}
    </span>
  )
}

export function ResourcePackBadge() {
  return (
    <span className="inline-flex max-w-[50%] shrink-0 truncate rounded-full border border-gray-300 bg-gray-100 px-2 py-1 text-sm font-normal leading-none text-gray-600 dark:border-[#2e3035] dark:bg-[#34363c] dark:text-gray-400">
      Ресурспак
    </span>
  )
}

export function DatapackResourcePackBanner() {
  return (
    <div className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-x-2 rounded-2xl border border-solid border-blue-500/40 bg-blue-500/10 p-4 text-gray-900 dark:border-blue-400/35 dark:bg-blue-500/10 dark:text-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 24 24"
        className="size-6 shrink-0 text-blue-500 dark:text-blue-400"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <p className="m-0 text-sm leading-snug text-gray-800 dark:text-white/85">
        Этот датапак также требует ресурспак. Скачайте его и поместите в папку{' '}
        <code className="rounded bg-black/5 px-1 py-0.5 text-sm dark:bg-white/10">resourcepacks</code>.
      </p>
    </div>
  )
}

export function DownloadIconButton({ href, download, label, className = '' }) {
  return (
    <StyledTooltip label={label}>
      <a
        href={href}
        download={download}
        aria-label={label}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-200/80 dark:text-gray-300 dark:hover:bg-[#2e3035] ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          className="size-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4"
          />
        </svg>
      </a>
    </StyledTooltip>
  )
}

export function DownloadFooterButton({
  onClick,
  disabled,
  loading,
  variant = 'secondary',
  tooltip,
  tooltipSide = 'top',
  className = '',
  loadingLabel = 'Подготовка…',
  children,
}) {
  const isPrimary = variant === 'primary'
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold shadow-none transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 min-[480px]:w-auto min-[480px]:text-base ${className} ${
        isPrimary
          ? 'bg-modrinth-green text-black hover:brightness-110'
          : 'bg-gray-200 text-gray-900 hover:brightness-105 dark:bg-[#34363c] dark:text-white dark:hover:brightness-110'
      }`}
    >
      {loading ? (
        <svg
          className="size-5 shrink-0 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          className="size-5 shrink-0"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4"
          />
        </svg>
      )}
      {loading ? loadingLabel : children}
    </button>
  )

  if (!tooltip) return button

  return (
    <StyledTooltip label={tooltip} side={tooltipSide} contentClassName="!max-w-[280px]">
      {button}
    </StyledTooltip>
  )
}
