import { catalogBlockedCopy } from '@/lib/i18n/catalogListing'

export default function CatalogEmptyResults({
  data,
  blockedCount,
  blockedByProject,
  blockedByOrganization,
  foundLabel,
  blockedTitle,
  emptyTitle,
  hideEmptyMessage = false,
}) {
  if (blockedCount > 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xl font-semibold text-red-400 mb-3">{blockedTitle}</p>
        <p className="text-gray-400 text-sm">
          {catalogBlockedCopy({
            totalHits: data.total_hits,
            foundLabel,
            blockedCount,
            blockedByProject,
            blockedByOrganization,
          })}
        </p>
      </div>
    )
  }

  if (hideEmptyMessage) return null

  return <p className="text-xl text-gray-400">{emptyTitle}</p>
}
