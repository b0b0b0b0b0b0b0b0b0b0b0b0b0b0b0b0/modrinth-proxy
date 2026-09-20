import { headers } from 'next/headers'
import { permanentRedirect } from 'next/navigation'
import { getMod, resolveProjectFeaturedBackdropUrl } from '@/lib/modrinth'
import { isOrganizationBlocked, isProjectBlocked } from '@/lib/contentFilter'
import { rewriteProjectPathToCanonical } from '@/lib/projectType'
import ProjectBackdrop from './ProjectBackdrop'

export default async function ProjectBackdropLayoutShell({ slug, children }) {
  const safeSlug = typeof slug === 'string' ? slug.trim() : typeof slug === 'number' ? String(slug) : ''

  if (!safeSlug || isProjectBlocked(safeSlug)) {
    return children
  }

  let project = null
  try {
    project = await getMod(safeSlug)
  } catch {
    project = null
  }

  let backdropSrc = null
  if (project && !isProjectBlocked(project.slug, project.id)) {
    const org = project.organization ?? project.organization_id
    if (!isOrganizationBlocked(org)) {
      const currentPath = headers().get('x-modrinth-pathname')
      const canonicalPath = rewriteProjectPathToCanonical(currentPath, project)
      if (canonicalPath) {
        permanentRedirect(canonicalPath)
      }
      backdropSrc = resolveProjectFeaturedBackdropUrl(project)
    }
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
