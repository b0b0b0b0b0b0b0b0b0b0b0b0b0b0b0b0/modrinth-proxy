'use client'

import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { resolveModrinthProjectAccent } from '@/lib/modrinth'
import { filterVersionChangelog } from '@/lib/contentFilter'
import RelativeTime from './RelativeTime'

function changelogBarClass(versionType) {
  if (versionType === 'release') return 'release'
  if (versionType === 'beta') return 'beta'
  return 'alpha'
}

export function ChangelogTimelineRow({ channel, isLast, header, children, resourceBarHex }) {
  const barMod = changelogBarClass(channel)

  const barStyle =
    resourceBarHex != null && resourceBarHex !== ''
      ? { ['--changelog-bar-color']: resourceBarHex }
      : undefined

  return (
    <li
      className={`changelog-item ${!isLast ? 'pb-2.5' : ''}`}
    >
      <div className="flex gap-x-2">
        <div className="changelog-bar-cell relative w-[1.625rem] shrink-0 self-stretch pt-0.5">
          <div
            className={`changelog-bar ${resourceBarHex ? '' : barMod}`}
            style={barStyle}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          {header}
          <div className="changelog-version-body mt-2">{children}</div>
        </div>
      </div>
    </li>
  )
}

const CHANGELOG_ITEMS_PER_PAGE = 20

export default function ChangelogVersionEntries({
  versions,
  slug,
  contentType,
  projectColor,
}) {
  const { resolvedTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  useEffect(() => setThemeMounted(true), [])
  const accent = useMemo(
    () => resolveModrinthProjectAccent(projectColor),
    [projectColor],
  )
  const resourceBarHex = accent?.accentHex
  const paginationAccent =
    themeMounted && accent && resolvedTheme === 'dark' ? accent : null

  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = versions?.length
    ? Math.ceil(versions.length / CHANGELOG_ITEMS_PER_PAGE)
    : 1

  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const page = Math.min(Math.max(1, currentPage), totalPages)

  const paginatedVersions = useMemo(() => {
    if (!versions?.length) return []
    const start = (page - 1) * CHANGELOG_ITEMS_PER_PAGE
    return versions.slice(start, start + CHANGELOG_ITEMS_PER_PAGE)
  }, [versions, page])

  const versionHref = (version) => {
    const id = version.id ?? version.version_number
    if (!id) return null
    return `/${contentType}/${slug}/version/${encodeURIComponent(id)}`
  }

  return (
    <>
      <ul className="m-0 list-none p-0">
        {paginatedVersions.map((version, index) => {
          const href = versionHref(version)
          const title = version.name || version.version_number
          const isLast = index === paginatedVersions.length - 1
          return (
            <ChangelogTimelineRow
            key={version.id ?? version.version_number}
            channel={version.version_type}
            isLast={isLast}
            resourceBarHex={resourceBarHex}
            header={
              <div className="mb-0 flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-white">
                  {href ? (
                    <Link
                      href={href}
                      className="transition-colors hover:text-modrinth-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] rounded-sm"
                    >
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                </h3>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    version.version_type === 'release'
                      ? 'bg-green-900 text-green-300'
                      : version.version_type === 'beta'
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-red-900 text-red-300'
                  }`}
                >
                  {version.version_type}
                </span>
                <span className="text-sm text-gray-500">
                  <RelativeTime dateString={version.date_published} />
                </span>
              </div>
            }
          >
            <div className="prose prose-invert prose-sm max-w-none text-sm text-gray-300">
              {version.changelog ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {filterVersionChangelog(version.changelog)}
                </ReactMarkdown>
              ) : (
                <p className="italic text-gray-500">Нет описания изменений</p>
              )}
            </div>
          </ChangelogTimelineRow>
        )
      })}

      </ul>

      {versions?.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад
          </button>

          <div className="flex items-center gap-2">
            {page > 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
                >
                  1
                </button>
                {page > 3 && <span className="text-gray-500">...</span>}
              </>
            )}

            {page > 1 && (
              <button
                type="button"
                onClick={() => setCurrentPage(page - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
              >
                {page - 1}
              </button>
            )}

            <div
              className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold ${
                paginationAccent
                  ? 'hover:!brightness-[1.08]'
                  : 'bg-modrinth-green text-black'
              }`}
              style={
                paginationAccent
                  ? {
                      backgroundColor: paginationAccent.accentHex,
                      color: paginationAccent.activeFgHex,
                    }
                  : undefined
              }
            >
              {page}
            </div>

            {page < totalPages && (
              <button
                type="button"
                onClick={() => setCurrentPage(page + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
              >
                {page + 1}
              </button>
            )}

            {page < totalPages - 1 && (
              <>
                {page < totalPages - 2 && <span className="text-gray-500">...</span>}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            Вперёд
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
