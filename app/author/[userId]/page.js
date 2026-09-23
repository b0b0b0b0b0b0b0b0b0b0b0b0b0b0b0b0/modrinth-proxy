import { notFound } from 'next/navigation'
import { getAuthorInfo, getAuthorProjects, formatAuthorStats, getProjectTypeDisplayName } from '@/lib/author'
import { getUserCollections } from '@/lib/collections'
import { filterModContent, filterModsList, filterUserPublic, isUserBlocked } from '@/lib/contentFilter'
import { formatDownloads } from '@/lib/modrinth'
import { resolveOrganizationsFromProjects } from '@/lib/organizations'
import { resolveUserBadges } from '@/lib/userBadges'
import ResourceList from '@/app/components/ResourceList'
import UserProfileHeader from '@/app/components/UserProfileHeader'
import dynamic from 'next/dynamic'

const AuthorProjectTabs = dynamic(() => import('@/app/components/AuthorProjectTabs'), {
  ssr: false,
  loading: () => <div className="mb-6 h-12 bg-modrinth-dark border border-gray-800 rounded-full animate-pulse"></div>,
})
import UserSidebar from '@/app/components/UserSidebar'
import { buildUserProfileMetadata } from '@/lib/profileSeo'

export async function generateMetadata({ params, searchParams }) {
  try {
    const author = filterUserPublic(await getAuthorInfo(params.userId))
    if (!author) {
      return {
        title: 'Автор не найден | ModrinthProxy',
        description: 'Запрашиваемый автор не найден',
      }
    }

    const projectType = searchParams.type || null
    const projects = await getAuthorProjects(author.id, { projectType })
    const stats = formatAuthorStats(author, projects.hits)

    return buildUserProfileMetadata(
      author,
      {
        projectCount: stats.projectCount,
        totalDownloads: formatDownloads(stats.totalDownloads),
      },
      author.id,
      { profilePath: 'author' },
    )
  } catch {
    return {
      title: 'Автор не найден | ModrinthProxy',
      description: 'Запрашиваемый автор не найден',
    }
  }
}

export default async function AuthorPage({ params, searchParams }) {
  const { userId } = params
  const projectType = searchParams.type || null

  if (isUserBlocked(userId)) {
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Доступ ограничен</h1>
        <p className="text-gray-400">Данный пользователь недоступен.</p>
      </div>
    )
  }

  let author, projects, stats, organizations, badges, collections
  try {
    author = filterUserPublic(await getAuthorInfo(userId))
    if (!author) notFound()

    const allProjects = await getAuthorProjects(author.id, { limit: 10000 })
    stats = formatAuthorStats(author, allProjects.hits)
    organizations = await resolveOrganizationsFromProjects(allProjects.hits)
    badges = resolveUserBadges(author, allProjects.hits)
    collections = await getUserCollections(author.id)
    const byType = projectType
      ? allProjects.hits.filter((project) => project.project_type === projectType)
      : allProjects.hits
    const filteredProjects = filterModsList(byType)
    projects = {
      hits: filteredProjects.hits.map((project) => ({
        ...filterModContent(project),
        author: author.username,
      })),
      total_hits: filteredProjects.hits.length,
    }
  } catch {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto">
      <UserProfileHeader author={author} stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <AuthorProjectTabs
            profileBasePath={`/author/${author.id}`}
            currentType={projectType}
            typeStats={stats.typeStats}
            totalProjects={stats.projectCount}
            collectionCount={collections.length}
            section="projects"
          />

          <div className="mt-4">
            {projects.hits.length > 0 ? (
              <ResourceList resources={projects.hits} type={projectType || 'mod'} isProfile={true} />
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  {projectType ? `Нет ${getProjectTypeDisplayName(projectType).toLowerCase()}` : 'Нет проектов'}
                </h3>
              </div>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <UserSidebar organizations={organizations} badges={badges} />
        </div>
      </div>
    </div>
  )
}
