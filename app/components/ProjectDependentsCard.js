'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { dependentCatalogHref, dependentCatalogsFor } from '@/lib/dependentsFilter'
import { intlLocale } from '@/lib/i18n/config'
import StyledTooltip from './StyledTooltip'
import { useI18n } from './I18nProvider'

export default function ProjectDependentsCard({ projectId, projectType, loaders = [], title }) {
  const { t, locale } = useI18n()
  const sentinelRef = useRef(null)
  const loadersKey = loaders.join(',')
  const requestKey = `${projectId}|${projectType}|${loadersKey}`
  const [result, setResult] = useState({ key: '', dependents: null })
  const dependents = result.key === requestKey ? result.dependents : null
  const enabled = Boolean(projectId) && dependentCatalogsFor(projectType, loaders).length > 0

  useEffect(() => {
    if (!enabled || !sentinelRef.current) return
    let cancelled = false
    const load = () => {
      const params = new URLSearchParams({ id: projectId, type: projectType, loaders: loadersKey })
      fetch(`/api/dependencies/dependents?${params.toString()}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!cancelled) setResult({ key: requestKey, dependents: data?.dependents || [] })
        })
        .catch(() => {
          if (!cancelled) setResult({ key: requestKey, dependents: [] })
        })
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        load()
      },
      { rootMargin: '300px' },
    )
    observer.observe(sentinelRef.current)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [enabled, projectId, projectType, loadersKey, requestKey])

  if (!enabled) return null
  if (dependents == null) return <DependentsSkeleton sentinelRef={sentinelRef} title={t('project.dependents')} />
  if (dependents.length === 0) return null

  return (
    <div className="ny-snow-host bg-modrinth-dark card-glass rounded-lg p-4">
      <DependentsHeading title={t('project.dependents')} />
      <div className="flex flex-wrap gap-2">
        {dependents.map(({ catalog, count }) => (
          <StyledTooltip key={catalog} label={t(`project.dependentsTipBy.${catalog}`, { name: title })}>
            <Link
              href={dependentCatalogHref(catalog, projectId)}
              className="glass-chip flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <span>{t(`nav.${catalog}`)}</span>
              <span className="text-modrinth-green font-semibold">{new Intl.NumberFormat(intlLocale(locale)).format(count)}</span>
            </Link>
          </StyledTooltip>
        ))}
      </div>
    </div>
  )
}

function DependentsHeading({ title }) {
  return (
    <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
      <svg className="w-4 h-4 text-modrinth-green" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="12" r="3" />
        <path d="M9 6h2a4 4 0 0 1 4 4v0M9 18h2a4 4 0 0 0 4-4v0" />
      </svg>
      {title}
    </h3>
  )
}

function DependentsSkeleton({ sentinelRef, title }) {
  return (
    <div ref={sentinelRef} aria-busy="true" className="ny-snow-host bg-modrinth-dark card-glass rounded-lg p-4">
      <DependentsHeading title={title} />
      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/15" />
        <div className="h-8 w-28 animate-pulse rounded-full bg-black/10 dark:bg-white/15" />
      </div>
    </div>
  )
}
