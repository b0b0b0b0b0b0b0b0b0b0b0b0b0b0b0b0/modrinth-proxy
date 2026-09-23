import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAuthorInfo } from '@/lib/author'
import { getCollection, getProjectsByIds } from '@/lib/collections'
import { filterModContent, filterModsList, filterUserPublic, isUserBlocked } from '@/lib/contentFilter'
import { formatDownloads } from '@/lib/modrinth'
import ResourceList from '@/app/components/ResourceList'

export async function generateMetadata({ params }) {
  const collection = await getCollection(params.id)
  if (!collection) {
    return {
      title: 'Коллекция не найдена | ModrinthProxy',
      robots: 'noindex',
    }
  }
  return {
    title: `${collection.name} — коллекция`,
    description: collection.description || `Коллекция ${collection.name}`,
    robots: 'all',
    openGraph: {
      siteName: 'modrinth.black',
      type: 'website',
      title: collection.name,
      description: collection.description || `Коллекция ${collection.name}`,
      images: collection.icon_url ? [{ url: collection.icon_url }] : [],
    },
  }
}

export default async function CollectionPage({ params }) {
  const collection = await getCollection(params.id)
  if (!collection) notFound()

  const ownerRaw = collection.user ? await getAuthorInfo(collection.user) : null
  if (ownerRaw && (isUserBlocked(ownerRaw.id) || isUserBlocked(ownerRaw.username))) {
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Доступ ограничен</h1>
        <p className="text-gray-400">Эта коллекция недоступна.</p>
      </div>
    )
  }
  const owner = filterUserPublic(ownerRaw)

  const rawProjects = await getProjectsByIds(collection.projects)
  const filtered = filterModsList(rawProjects)
  const projects = filtered.hits.map((project) => filterModContent(project))
  const downloads = projects.reduce((sum, project) => sum + (project.downloads || 0), 0)
  const projectCount = projects.length

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-800 pb-6 sm:flex-row sm:items-start">
        {collection.icon_url ? (
          <img
            src={collection.icon_url}
            alt=""
            className="h-24 w-24 shrink-0 rounded-lg object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-semibold text-gray-500">Коллекция</p>
          <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
          {collection.description ? (
            <p className="mt-2 max-w-3xl text-gray-300">{collection.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-400">
            <span>
              <span className="font-semibold text-white">{projectCount}</span>
              {' '}
              проект{projectCount === 1 ? '' : projectCount < 5 ? 'а' : 'ов'}
            </span>
            <span>
              <span className="font-semibold text-white">{formatDownloads(downloads)}</span>
              {' '}
              загрузок
            </span>
            {owner ? (
              <Link href={`/user/${owner.id}`} className="text-modrinth-green hover:underline">
                {owner.username}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {projects.length > 0 ? (
        <ResourceList resources={projects} type="mod" isProfile={true} />
      ) : (
        <div className="py-16 text-center">
          <h3 className="text-xl font-semibold text-gray-300">В коллекции нет доступных проектов</h3>
        </div>
      )}
    </div>
  )
}
