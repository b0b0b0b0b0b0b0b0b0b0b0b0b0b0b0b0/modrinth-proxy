import { catalogBlockedCopy } from '@/lib/i18n/catalogListing'
import LostKitten from './LostKitten'
import RestrictedNotice from './RestrictedNotice'

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
      <RestrictedNotice
        title={blockedTitle}
        details={[
          catalogBlockedCopy({
            totalHits: data.total_hits,
            foundLabel,
            blockedCount,
            blockedByProject,
            blockedByOrganization,
          }),
        ]}
      />
    )
  }

  if (hideEmptyMessage) return null

  return <LostKitten text={emptyTitle} />
}
