'use client'

import StyledTooltip from '../components/StyledTooltip'

function formatRu(dateString) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function ApiLink({ href, label, path, data }) {
  const version = data?.version
  const published = data?.published_at ? formatRu(data.published_at) : null
  const checked = data?.checked_at ? formatRu(data.checked_at) : null

  const tooltip = (
    <span className="flex flex-col gap-1 text-left leading-snug">
      {version ? <span className="font-semibold text-white">v{version}</span> : null}
      {published ? (
        <span className="text-[11px] text-gray-300">релиз: {published}</span>
      ) : null}
      {checked ? (
        <span className="text-[11px] text-gray-300">проверено: {checked}</span>
      ) : (
        <span className="text-[11px] text-gray-400">ещё не проверяли</span>
      )}
    </span>
  )

  return (
    <StyledTooltip side="top" contentClassName="!px-3.5 !py-2.5" label={tooltip}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-modrinth-green dark:text-gray-300"
      >
        <svg className="h-4 w-4 shrink-0 text-modrinth-green" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8 16-4-4 4-4m8 0 4 4-4 4" />
        </svg>
        {label}
        <span className="text-gray-400 group-hover:text-modrinth-green/70">{path}</span>
      </a>
    </StyledTooltip>
  )
}

export default function LauncherLastUpdate({ launcherData, astralData }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <ApiLink
        href="/api/launcher"
        label="Modrinth"
        path="/api/launcher"
        data={launcherData}
      />
      <ApiLink
        href="/api/astralrinth"
        label="AstralRinth"
        path="/api/astralrinth"
        data={astralData}
      />
    </div>
  )
}
