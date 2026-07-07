'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { dependencyTypeLabel } from '@/lib/dependencies'
import StyledTooltip from './StyledTooltip'

const DependencyExplorerModal = dynamic(
  () => import('./DependencyExplorer'),
  { ssr: false, loading: () => null },
)

const clientCache = new Map()

const RELEVANT_TYPES = new Set(['required', 'optional', 'embedded'])

function normalizeDependencies(dependencies) {
  return Array.isArray(dependencies) ? dependencies : []
}

function filterRelevantDependencies(dependencies) {
  return normalizeDependencies(dependencies).filter((dep) =>
    RELEVANT_TYPES.has(dep.dependency_type),
  )
}

const BADGE_STYLES = {
  required:
    'bg-modrinth-green/12 text-modrinth-green border border-modrinth-green/25 dark:bg-modrinth-green/15',
  optional:
    'bg-gray-500/10 text-gray-600 border border-gray-500/20 dark:bg-white/5 dark:text-gray-400 dark:border-gray-600/50',
  embedded:
    'bg-blue-500/10 text-blue-600 border border-blue-500/25 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/35',
}

const BADGE_TOOLTIPS = {
  required: 'Обязательный файл для запуска',
  optional: 'Не обязателен, работает и без него',
  embedded: 'Уже встроен в основной файл',
}

function buildCacheKey(dependencies, loader, gameVersion) {
  const depKeys = filterRelevantDependencies(dependencies)
    .map((dep) => `${dep.dependency_type}:${dep.version_id || ''}:${dep.project_id || ''}`)
    .sort()
    .join('|')
  return `${loader}:${gameVersion}:${depKeys}`
}

function DependencyGraphButton({ onOpen }) {
  return (
    <StyledTooltip label="Граф зависимостей">
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200/80 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-[#2e3035] dark:hover:text-gray-200"
        aria-label="Граф зависимостей"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <path strokeLinecap="round" d="M8 6h8M7 8l3 8M17 8l-3 8" />
        </svg>
      </button>
    </StyledTooltip>
  )
}

function DependencyTypeBadge({ type }) {
  const tooltip = BADGE_TOOLTIPS[type] || BADGE_TOOLTIPS.optional

  return (
    <StyledTooltip label={tooltip}>
      <span
        role="presentation"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        className={`inline-flex shrink-0 cursor-help rounded px-1.5 py-0.5 text-[9px] font-semibold leading-none ${BADGE_STYLES[type] || BADGE_STYLES.optional}`}
      >
        {dependencyTypeLabel(type)}
      </span>
    </StyledTooltip>
  )
}

export default function DownloadVersionDependencies({
  dependencies,
  loader,
  gameVersion,
  primaryFilename,
  projectSlug,
  projectTitle,
  versionNumber,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)
  const [resolvedDependencies, setResolvedDependencies] = useState(() =>
    normalizeDependencies(dependencies),
  )
  const [depsLoading, setDepsLoading] = useState(false)

  const propRelevantDeps = useMemo(
    () => filterRelevantDependencies(dependencies),
    [dependencies],
  )

  useEffect(() => {
    if (propRelevantDeps.length > 0) {
      setResolvedDependencies(normalizeDependencies(dependencies))
      setDepsLoading(false)
      return undefined
    }

    if (!projectSlug || !versionNumber) {
      setResolvedDependencies([])
      setDepsLoading(false)
      return undefined
    }

    let cancelled = false
    setDepsLoading(true)

    const params = new URLSearchParams({
      slug: projectSlug,
      version: String(versionNumber),
    })

    fetch(`/api/dependencies?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return
        setResolvedDependencies(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setResolvedDependencies([])
      })
      .finally(() => {
        if (!cancelled) setDepsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [dependencies, propRelevantDeps.length, projectSlug, versionNumber])

  const relevantDeps = useMemo(
    () => filterRelevantDependencies(resolvedDependencies),
    [resolvedDependencies],
  )

  const canShowGraph = Boolean(projectSlug && versionNumber)
  const hasDeps = relevantDeps.length > 0

  const cacheKey = useMemo(
    () => (hasDeps && loader && gameVersion ? buildCacheKey(resolvedDependencies, loader, gameVersion) : ''),
    [resolvedDependencies, hasDeps, loader, gameVersion],
  )

  useEffect(() => {
    if (!cacheKey) {
      setItems([])
      setLoading(false)
      return undefined
    }

    const cached = clientCache.get(cacheKey)
    if (cached) {
      setItems(cached)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    fetch('/api/download-dependencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dependencies: resolvedDependencies, loader, gameVersion }),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return
        const resolved = Array.isArray(data) ? data : []
        clientCache.set(cacheKey, resolved)
        setItems(resolved)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cacheKey, resolvedDependencies, loader, gameVersion])

  if (!hasDeps && !depsLoading && !loading) return null

  const depCount = items.length > 0 || !loading ? items.length : relevantDeps.length
  const showDepsLoading = (depsLoading || loading) && items.length === 0

  return (
    <>
      <div className="animate-fade-in-up space-y-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="m-0 text-xs font-semibold text-gray-700 dark:text-gray-300">
              {showDepsLoading ? 'Зависимости…' : `Зависимости (${depCount})`}
            </p>
            {canShowGraph && (
              <DependencyGraphButton onOpen={() => setGraphOpen(true)} />
            )}
          </div>
          {primaryFilename && (
            <p className="m-0 mt-0.5 truncate text-[10px] leading-snug text-gray-500 dark:text-gray-500">
              Для файла{' '}
              <span className="font-mono text-gray-600 dark:text-gray-400">{primaryFilename}</span>
            </p>
          )}
        </div>
        {items.length > 0 && (
          <div className="space-y-1.5 max-h-[min(320px,40vh)] overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
            {items.map((item) => (
              <a
                key={`${item.projectId || item.versionId}:${item.filename}`}
                href={item.url}
                download
                className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/80 px-2.5 py-2 text-left no-underline transition-colors hover:border-modrinth-green/40 dark:border-[#2e3035] dark:bg-[#16181c]/80"
              >
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium text-gray-800 dark:text-gray-200">
                      {item.title}
                    </span>
                    <DependencyTypeBadge type={item.dependencyType} />
                  </span>
                  <span className="block truncate font-mono text-[10px] text-gray-500 dark:text-gray-500">
                    {item.filename}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-modrinth-green/15 px-2 py-1 text-[10px] font-bold text-modrinth-green">
                  <svg className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Скачать
                </span>
              </a>
            ))}
          </div>
        )}
        {showDepsLoading && (
          <div className="h-9 animate-pulse rounded-xl bg-gray-200/80 dark:bg-[#2e3035]/80" />
        )}
      </div>
      {graphOpen && projectSlug && (
        <DependencyExplorerModal
          projectSlug={projectSlug}
          projectTitle={projectTitle}
          versionNumber={versionNumber}
          defaultOpen
          hideTrigger
          overlayClassName="!z-[210]"
          onClose={() => setGraphOpen(false)}
        />
      )}
    </>
  )
}
