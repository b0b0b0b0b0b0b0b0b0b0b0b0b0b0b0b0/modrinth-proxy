'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { resolveModrinthProjectAccent } from '@/lib/modrinth'
import { versionChannelLetterRingClass } from '@/lib/versionChannelStyles'
import { filterVersionChangelog } from '@/lib/contentFilter'
import RelativeTime from './RelativeTime'
import CatalogPagination from './CatalogPagination'
import { useT } from './I18nProvider'

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
  const t = useT()
  const accent = useMemo(
    () => resolveModrinthProjectAccent(projectColor),
    [projectColor],
  )
  const resourceBarHex = accent?.accentHex

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
                    className={`rounded px-2 py-0.5 text-xs border ${versionChannelLetterRingClass(version.version_type)}`}
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
                <p className="italic text-gray-500">{t('version.noChangelog')}</p>
              )}
            </div>
          </ChangelogTimelineRow>
        )
      })}

      </ul>

      {versions?.length > 0 && (
        <CatalogPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-6 border-t border-gray-800 pt-4"
        />
      )}
    </>
  )
}
