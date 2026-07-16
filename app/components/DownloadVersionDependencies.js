'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { normalizeContentRoute } from '@/lib/contextualVersions'
import { DatapackResourcePackBanner, DownloadIconButton, ResourcePackBadge } from './DownloadModalParts'
import { isDatapackDownloadContext } from '@/lib/downloadBundledFiles'
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

function buildCacheKey(dependencies, loader, gameVersion) {
  const depKeys = filterRelevantDependencies(dependencies)
    .map((dep) => `${dep.dependency_type}:${dep.version_id || ''}:${dep.project_id || ''}`)
    .sort()
    .join('|')
  return `${loader}:${gameVersion}:${depKeys}`
}

function flattenDepTree(tree) {
  const flat = []
  const seen = new Set()
  const walk = (nodes) => {
    for (const node of nodes) {
      const { children, ...item } = node
      const key = item.projectId || item.versionId || item.filename
      if (!seen.has(key)) {
        seen.add(key)
        flat.push(item)
      }
      walk(children || [])
    }
  }
  walk(tree)
  return flat
}

function DependencyTreeNode({ item }) {
  const children = item.children || []

  return (
    <div className="flex min-w-0 flex-col">
      <DependencyTreeRow item={item} />
      {children.map((child, childIndex) => (
        <DependencyTreeRow
          key={`${child.projectId || child.versionId}:${child.filename}`}
          item={child}
          nested
          isLastChild={childIndex === children.length - 1}
        />
      ))}
    </div>
  )
}

function DependenciesInfoIcon() {
  return (
    <StyledTooltip label="Файлы, которые нужны для работы выбранной версии">
      <span
        tabIndex={0}
        className="inline-flex size-4 shrink-0 cursor-help items-center justify-center text-gray-500 dark:text-gray-400"
        aria-label="О зависимостях"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </span>
    </StyledTooltip>
  )
}

function DependencyTreeRow({ item, nested = false, isLastChild = false }) {
  const contentRoute = normalizeContentRoute(item.projectType || 'mod')
  const projectHref = item.slug ? `/${contentRoute}/${item.slug}` : null
  const showResourcePackBadge = item.isResourcePackFile
  const title = item.title || item.filename

  const row = (
    <div className="z-10 grid h-11 grid-cols-[minmax(0,1fr)_min-content] items-center gap-1 text-gray-900 dark:text-gray-200">
      <span className="flex min-w-0 items-center gap-2">
        {item.iconUrl && !showResourcePackBadge && (
          <img
            src={item.iconUrl}
            alt=""
            className="size-6 shrink-0 rounded-lg shadow-none"
            referrerPolicy="no-referrer"
          />
        )}
        {projectHref && !showResourcePackBadge ? (
          <Link
            href={projectHref}
            className="min-w-0 truncate bg-transparent text-base font-semibold text-gray-900 no-underline hover:underline dark:text-white"
          >
            {title}
          </Link>
        ) : (
          <span
            className={`min-w-0 truncate bg-transparent text-base text-gray-900 dark:text-white ${
              showResourcePackBadge ? 'font-medium' : 'font-semibold'
            }`}
          >
            {title}
          </span>
        )}
        {showResourcePackBadge ? (
          <ResourcePackBadge />
        ) : (
          <StyledTooltip label={item.versionLabel}>
            <span className="min-w-0 max-w-[50%] truncate text-sm text-gray-500 dark:text-gray-400">
              {item.versionLabel}
            </span>
          </StyledTooltip>
        )}
      </span>
      <DownloadIconButton
        href={item.url}
        download={item.filename}
        label={`Скачать ${item.filename}`}
        className="!text-gray-500 dark:!text-gray-400"
      />
    </div>
  )

  if (!nested) {
    return row
  }

  return (
    <div className="group/dependency relative pl-8">
      <div className="relative z-10 flex min-w-0 flex-col">{row}</div>
      <div
        aria-hidden
        className={`absolute -top-2.5 left-3 z-0 w-0.5 bg-gray-300 dark:bg-[#2e3035] ${
          isLastChild ? 'h-8' : 'h-full'
        }`}
      />
      <div
        aria-hidden
        className="absolute left-3 top-[21px] z-0 h-0.5 w-7 bg-gray-300 dark:bg-[#2e3035]"
      />
    </div>
  )
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

export default function DownloadVersionDependencies({
  dependencies,
  loader,
  gameVersion,
  contentType,
  projectSlug,
  projectTitle,
  versionNumber,
  onResolved,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)
  const [resolvedDependencies, setResolvedDependencies] = useState(() =>
    normalizeDependencies(dependencies),
  )
  const [depsLoading, setDepsLoading] = useState(false)
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  const isDatapack = isDatapackDownloadContext(contentType, loader)

  useEffect(() => {
    if (Array.isArray(dependencies)) {
      setResolvedDependencies(dependencies)
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
  }, [dependencies, projectSlug, versionNumber])

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
      onResolvedRef.current?.([])
      return undefined
    }

    const cached = clientCache.get(cacheKey)
    if (cached) {
      const tree = Array.isArray(cached) ? cached : cached.tree || []
      const files = Array.isArray(cached) ? flattenDepTree(cached) : cached.files || []
      setItems(tree)
      setLoading(false)
      onResolvedRef.current?.(files)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    fetch('/api/download-dependencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dependencies: resolvedDependencies, loader, gameVersion }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const tree = Array.isArray(data) ? data : Array.isArray(data?.tree) ? data.tree : []
        const files = Array.isArray(data?.files)
          ? data.files
          : flattenDepTree(tree)
        clientCache.set(cacheKey, { tree, files })
        setItems(tree)
        onResolvedRef.current?.(files)
      })
      .catch(() => {
        if (!cancelled) {
          setItems([])
          onResolvedRef.current?.([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cacheKey, resolvedDependencies, loader, gameVersion])

  const showResourcePackNotice = useMemo(() => {
    if (!isDatapack) return false
    return flattenDepTree(items).some((item) => item.isResourcePackFile)
  }, [isDatapack, items])

  if (!hasDeps && !depsLoading && !loading) return null

  const showDepsLoading = (depsLoading || loading) && items.length === 0

  return (
    <>
      <div className="animate-fade-in-up mb-6 flex flex-col gap-2.5 rounded-2xl border border-gray-800 bg-modrinth-dark p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="m-0 flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-white">
            Зависимости
            <DependenciesInfoIcon />
          </h3>
          {canShowGraph && <DependencyGraphButton onOpen={() => setGraphOpen(true)} />}
        </div>

        {showResourcePackNotice && <DatapackResourcePackBanner />}

        <div className="rounded-2xl bg-gray-100 p-2 pl-4 pr-3 dark:bg-[#1e2024]">
          {showDepsLoading && (
            <div className="h-11 animate-pulse rounded-xl bg-gray-200/80 dark:bg-[#2e3035]/80" />
          )}
          {items.length > 0 && (
            <div className="flex min-w-0 flex-col">
              {items.map((item) => (
                <DependencyTreeNode
                  key={`${item.projectId || item.versionId}:${item.filename}`}
                  item={item}
                />
              ))}
            </div>
          )}
        </div>
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
