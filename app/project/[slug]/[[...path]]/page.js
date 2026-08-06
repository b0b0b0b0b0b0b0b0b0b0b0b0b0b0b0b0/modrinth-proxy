import { notFound, redirect } from 'next/navigation'
import { getMod } from '@/lib/modrinth'
import { isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import { resolveProjectHref } from '@/lib/dependencies'

export default async function ProjectRedirectPage({ params }) {
  const { slug, path } = params

  let project
  try {
    project = await getMod(slug)
  } catch {
    notFound()
  }

  if (isProjectBlocked(project.slug, project.id) || isOrganizationBlocked(project.organization)) {
    notFound()
  }

  const baseHref = resolveProjectHref(project)
  if (!baseHref) {
    notFound()
  }

  const suffix = Array.isArray(path) && path.length > 0 ? `/${path.join('/')}` : ''
  redirect(`${baseHref}${suffix}`)
}
