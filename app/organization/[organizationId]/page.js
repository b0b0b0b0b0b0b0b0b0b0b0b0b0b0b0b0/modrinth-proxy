import { notFound, redirect } from 'next/navigation'
import { getOrganization, getOrganizationProjects } from '@/lib/modrinth'
import {
  OrganizationPresenter,
  OrganizationStats,
  formatOrganizationDownloadsRu,
  pluralRu,
} from '@/lib/organizations'
import {
  filterModContent,
  filterModsList,
  filterOrganizationMembers,
  isOrganizationBlocked,
} from '@/lib/contentFilter'
import { IconBuilding2, IconDownload, IconPackage, IconUsers } from '@/lib/icons'
import ResourceList from '@/app/components/ResourceList'
import OrganizationMembersSidebar from '@/app/components/OrganizationMembersSidebar'

export async function generateMetadata({ params }) {
  try {
    const organization = await getOrganization(params.organizationId)
    if (!organization?.id) {
      return {
        title: 'Организация не найдена | ModrinthProxy',
        description: 'Запрашиваемая организация не найдена',
      }
    }

    if (
      isOrganizationBlocked(params.organizationId) ||
      isOrganizationBlocked(organization.id) ||
      isOrganizationBlocked(organization.slug)
    ) {
      return {
        title: 'Доступ ограничен | ModrinthProxy',
        description: 'Данная организация недоступна',
      }
    }

    const presenter = new OrganizationPresenter(organization)

    return {
      title: `${presenter.name} — Организация`,
      description: presenter.description || `Проекты организации ${presenter.name} на ModrinthProxy`,
      robots: 'all',
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        title: `${presenter.name} — Организация`,
        description: presenter.description || `Проекты организации ${presenter.name}`,
        images: presenter.iconUrl ? [{ url: presenter.iconUrl }] : [],
      },
    }
  } catch {
    return {
      title: 'Организация не найдена | ModrinthProxy',
      description: 'Запрашиваемая организация не найдена',
    }
  }
}

function StatItem({ icon: Icon, children, withDivider = true }) {
  return (
    <div
      className={`flex items-center gap-2 font-semibold text-gray-600 dark:text-gray-400 ${
        withDivider ? 'border-0 border-r border-gray-200 dark:border-gray-700 pr-4' : ''
      }`}
    >
      <Icon className="size-6 shrink-0 text-gray-500 dark:text-gray-400" />
      <span className="text-sm text-gray-800 dark:text-gray-200">{children}</span>
    </div>
  )
}

export default async function OrganizationPage({ params }) {
  const { organizationId } = params

  let organization
  try {
    organization = await getOrganization(organizationId)
    if (!organization?.id) notFound()
    if (organization.id !== organizationId) {
      redirect(`/organization/${organization.id}`)
    }
  } catch {
    notFound()
  }

  if (
    isOrganizationBlocked(organizationId) ||
    isOrganizationBlocked(organization.id) ||
    isOrganizationBlocked(organization.slug)
  ) {
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Доступ ограничен</h1>
        <p className="text-gray-400">Данная организация недоступна.</p>
      </div>
    )
  }

  const presenter = new OrganizationPresenter(organization)
  const rawProjects = await getOrganizationProjects(organization.id)
  const filteredProjects = filterModsList(rawProjects)
  const projects = filteredProjects.hits.map((project) => filterModContent(project))
  const members = filterOrganizationMembers(organization.members || [])
  const stats = new OrganizationStats(organization, projects)

  const memberLabel = pluralRu(stats.memberCount, 'участник', 'участника', 'участников')
  const projectLabel = pluralRu(stats.projectCount, 'проект', 'проекта', 'проектов')
  const downloadLabel = pluralRu(stats.totalDownloads, 'загрузка', 'загрузки', 'загрузок')

  return (
    <div className="max-w-7xl mx-auto">
      <div className="py-4">
        <div className="flex flex-col gap-2 border-0 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="flex flex-wrap items-start gap-4 max-md:flex-col">
            <div className="flex min-w-0 flex-1 gap-4">
              {presenter.iconUrl ? (
                <img
                  src={presenter.iconUrl}
                  alt={presenter.name}
                  className="size-24 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex size-24 shrink-0 items-center justify-center rounded border border-orange-400/30 bg-gradient-to-br from-orange-500/20 to-orange-400/10">
                  <IconBuilding2 className="h-10 w-10 text-orange-400" />
                </div>
              )}
              <div className="flex min-w-0 flex-col justify-center gap-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="m-0 text-2xl font-semibold leading-none text-gray-900 dark:text-white">
                      {presenter.name}
                    </h1>
                    <div className="ml-1 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      <IconBuilding2 className="size-5 shrink-0" />
                      <span>Организация</span>
                    </div>
                  </div>
                  {presenter.description && (
                    <p className="m-0 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-2">
                      {presenter.description}
                    </p>
                  )}
                </div>
                <div className="hidden md:flex flex-wrap gap-3">
                  <StatItem icon={IconUsers}>
                    {stats.memberCount} {memberLabel}
                  </StatItem>
                  <StatItem icon={IconPackage}>
                    {stats.projectCount} {projectLabel}
                  </StatItem>
                  <StatItem icon={IconDownload} withDivider={false}>
                    {formatOrganizationDownloadsRu(stats.totalDownloads)} {downloadLabel}
                  </StatItem>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 md:hidden">
            <StatItem icon={IconUsers}>
              {stats.memberCount} {memberLabel}
            </StatItem>
            <StatItem icon={IconPackage}>
              {stats.projectCount} {projectLabel}
            </StatItem>
            <StatItem icon={IconDownload} withDivider={false}>
              {formatOrganizationDownloadsRu(stats.totalDownloads)} {downloadLabel}
            </StatItem>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          {projects.length > 0 ? (
            <ResourceList resources={projects} type="mod" isProfile />
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Нет проектов</h3>
              <p className="text-gray-500">У этой организации пока нет опубликованных проектов.</p>
            </div>
          )}
        </div>
        <div className="lg:sticky lg:top-4 lg:self-start">
          <OrganizationMembersSidebar members={members} />
        </div>
      </div>
    </div>
  )
}
