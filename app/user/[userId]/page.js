import { notFound, redirect } from 'next/navigation'
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
    )
  } catch {
    return {
      title: 'Автор не найден | ModrinthProxy',
      description: 'Запрашиваемый автор не найден',
    }
  }
}

export default async function UserPage({ params, searchParams }) {
  const { userId } = params
  const projectType = searchParams.type || null

  if (isUserBlocked(userId)) {
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <div className="mb-6">
          <svg className="w-20 h-20 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-3xl font-bold text-red-500 mb-4">Доступ ограничен</h1>
          <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-6 mb-6 text-left">
            <p className="text-gray-300 mb-3">
              Данный пользователь недоступен в соответствии с региональными ограничениями и требованиями Роскомнадзора.
            </p>
            <p className="text-gray-400 text-sm">
              К сожалению, некоторые пользователи были заблокированы на территории Российской Федерации по решению регулирующих органов. Мы вынуждены ограничить доступ к этому контенту для соблюдения действующего законодательства.
            </p>
          </div>
        </div>
      </div>
    )
  }

  let author, projects, stats, organizations, badges, collections
  try {
    author = filterUserPublic(await getAuthorInfo(userId))

    if (!author) {
      notFound()
    }

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
  } catch (error) {
    notFound()
  }

  if (!projectType && stats.projectCount === 0 && collections.length > 0) {
    redirect(`/user/${author.id}/collections`)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <UserProfileHeader author={author} stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <AuthorProjectTabs
            profileBasePath={`/user/${author.id}`}
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
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="M3.29 7 12 12l8.71-5M12 22V12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  {projectType ? `Нет ${getProjectTypeDisplayName(projectType).toLowerCase()}` : 'Нет проектов'}
                </h3>
                <p className="text-gray-500">
                  {projectType
                    ? `У этого автора пока нет опубликованных ${getProjectTypeDisplayName(projectType).toLowerCase()}`
                    : 'У этого автора пока нет опубликованных проектов'}
                </p>
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
