import { getProjectDisclosures } from '@/lib/modrinth'
import { sortSidebarDisclosures } from '@/lib/projectDisclosures'
import ResourceSidebar from './ResourceSidebar'
import StickyScrollSidebar from './StickyScrollSidebar'

export default async function ResourceSidebarContainer(props) {
  const slug = props.resource?.slug || props.resource?.id
  const disclosures = slug ? await getProjectDisclosures(slug) : []
  const sidebarDisclosures = sortSidebarDisclosures(disclosures)

  return (
    <StickyScrollSidebar>
      <ResourceSidebar {...props} disclosures={sidebarDisclosures} />
    </StickyScrollSidebar>
  )
}
