import { getMod, resolveProjectFeaturedBackdropUrl } from '@/lib/modrinth'
import { isOrganizationBlocked, isProjectBlocked } from '@/lib/contentFilter'
import ProjectBackdrop from './ProjectBackdrop'

export default async function ProjectBackdropLayoutShell({ slug, children }) {
  const safeSlug = typeof slug === 'string' ? slug.trim() : typeof slug === 'number' ? String(slug) : ''

  if (!safeSlug || isProjectBlocked(safeSlug)) {
    return children
  }

  let backdropSrc = null
  try {
    const project = await getMod(safeSlug)
    const org =
      project && typeof project === 'object'
        ? (project.organization ?? project.organization_id)
        : undefined
    if (project && !isProjectBlocked(project.slug, project.id) && !isOrganizationBlocked(org)) {
      backdropSrc = resolveProjectFeaturedBackdropUrl(project)
    }
  } catch {
    backdropSrc = null
  }

  const showBackdrop =
    typeof backdropSrc === 'string' &&
    backdropSrc.trim() &&
    /^https?:\/\//i.test(backdropSrc.trim())

  return (
    <div className="relative">
      {showBackdrop ? <ProjectBackdrop src={backdropSrc} /> : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}
