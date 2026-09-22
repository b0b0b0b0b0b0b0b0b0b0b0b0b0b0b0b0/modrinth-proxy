'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  fetchGitHubRepoStats,
  formatGitHubCount,
  parseGitHubRepoFromSourceUrl,
  pluralRu,
} from '@/lib/github'

function ExternalIcon() {
  return (
    <svg
      className="w-3 h-3 flex-shrink-0 opacity-60"
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

function GitHubRow({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-white transition-colors group"
    >
      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-gray-500 group-hover:text-gray-300">
        {icon}
      </span>
      <span className="min-w-0 flex-1 group-hover:underline">{label}</span>
      <ExternalIcon />
    </a>
  )
}

export default function GitHubSidebarSection({ sourceUrl }) {
  const repoInfo = useMemo(() => parseGitHubRepoFromSourceUrl(sourceUrl), [sourceUrl])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!repoInfo) {
      setStats(null)
      return undefined
    }

    let cancelled = false
    fetchGitHubRepoStats(repoInfo.repo)
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {
        if (!cancelled) setStats(null)
      })

    return () => {
      cancelled = true
    }
  }, [repoInfo])

  if (!repoInfo) return null

  const { repo, repoUrl } = repoInfo
  const href = sourceUrl?.trim() || repoUrl

  return (
    <div className="ny-snow-host bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
      <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        GitHub
      </h3>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 flex items-center gap-2.5 rounded-lg border border-gray-200/80 bg-gray-50/80 px-2.5 py-2 text-left no-underline dark:border-[#2e3035] dark:bg-[#16181c]/80"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gray-200/80 text-gray-600 dark:bg-[#2e3035] dark:text-gray-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6l-6 6 6 6M16 18l6-6-6-6" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-gray-800 dark:text-gray-200">Исходный код</span>
          <span className="block truncate font-mono text-[11px] text-gray-500 dark:text-gray-500">{repo}</span>
        </span>
        <ExternalIcon />
      </a>

      {stats && (
        <div className="space-y-2 border-t border-gray-200/80 pt-3 dark:border-gray-800">
          <GitHubRow
            href={`${repoUrl}/stargazers`}
            label={`${formatGitHubCount(stats.stars)} ${pluralRu(stats.stars, 'звезда', 'звезды', 'звёзд')}`}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
          <GitHubRow
            href={`${repoUrl}/issues`}
            label={`${stats.issues} ${pluralRu(stats.issues, 'открытая задача', 'открытые задачи', 'открытых задач')}`}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <GitHubRow
            href={`${repoUrl}/pulls`}
            label={`${stats.prs} ${pluralRu(stats.prs, 'открытый пул-реквест', 'открытых пул-реквеста', 'открытых пул-реквестов')}`}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v3H7V7zm0 7h10v3H7v-3zm-4-3h2m0 0h2m-2 0v3m0-3V11m12 0h2m0 0h2m-2 0v3m0-3V11" />
              </svg>
            }
          />
          <GitHubRow
            href={`${repoUrl}/network/members`}
            label={`${formatGitHubCount(stats.forks)} ${pluralRu(stats.forks, 'форк', 'форка', 'форков')}`}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6a2 2 0 114 0v1h4V6a2 2 0 114 0v1h2a2 2 0 012 2v2H4V9a2 2 0 012-2h2V6zM4 13h16v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4z" />
              </svg>
            }
          />
        </div>
      )}
    </div>
  )
}
