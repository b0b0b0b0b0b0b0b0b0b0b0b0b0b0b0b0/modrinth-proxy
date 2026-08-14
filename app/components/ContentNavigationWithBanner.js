import { getProjectDisclosures } from '@/lib/modrinth'
import { findArchivedDisclosure } from '@/lib/projectDisclosures'
import ContentNavigation from './ContentNavigation'
import ProjectArchivedBanner from './ProjectArchivedBanner'

export default async function ContentNavigationWithBanner({
  resource,
  contentType,
  versionsCount = 0,
  galleryCount = 0,
  projectColor,
}) {
  const slug = resource?.slug || resource?.id
  const disclosures = slug ? await getProjectDisclosures(slug) : []
  const archived = findArchivedDisclosure(disclosures)

  return (
    <>
      {archived ? (
        <ProjectArchivedBanner title={resource?.title} note={archived.note} />
      ) : null}
      <ContentNavigation
        slug={slug}
        contentType={contentType}
        versionsCount={versionsCount}
        galleryCount={galleryCount}
        projectColor={projectColor}
      />
    </>
  )
}
