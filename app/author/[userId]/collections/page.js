import { notFound } from 'next/navigation'
import { getAuthorInfo, getAuthorProjects, formatAuthorStats } from '@/lib/author'
import { getUserCollections } from '@/lib/collections'
import { filterUserPublic, isUserBlocked } from '@/lib/contentFilter'
import { resolveOrganizationsFromProjects } from '@/lib/organizations'
import { resolveUserBadges } from '@/lib/userBadges'
import CollectionCard from '@/app/components/CollectionCard'
import UserProfileHeader from '@/app/components/UserProfileHeader'
import dynamic from 'next/dynamic'
import UserSidebar from '@/app/components/UserSidebar'
import { getRequestT } from '@/lib/i18n/server'

const AuthorProjectTabs = dynamic(() => import('@/app/components/AuthorProjectTabs'), {
  ssr: false,
  loading: () => <div className="mb-6 h-12 bg-modrinth-dark border border-gray-800 rounded-full animate-pulse"></div>,
})

export async function generateMetadata({ params }) {
  const { t } = getRequestT()
  try {
    const author = filterUserPublic(await getAuthorInfo(params.userId))
    if (!author) {
      return { title: t('author.notFound') }
    }
    return {
      title: t('author.metaCollections', { name: author.username }),
      description: t('author.metaCollectionsDesc', { name: author.username }),
      robots: 'all',
    }
  } catch {
    return { title: t('author.notFound') }
  }
}

export default async function AuthorCollectionsPage({ params }) {
  const { t } = getRequestT()
  const { userId } = params

  if (isUserBlocked(userId)) {
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-red-500 mb-4">{t('restricted.title')}</h1>
        <p className="text-gray-400">{t('restricted.user')}</p>
      </div>
    )
  }

  const author = filterUserPublic(await getAuthorInfo(userId))
  if (!author) notFound()

  const allProjects = await getAuthorProjects(author.id, { limit: 10000 })
  const stats = formatAuthorStats(author, allProjects.hits)
  const organizations = await resolveOrganizationsFromProjects(allProjects.hits)
  const badges = resolveUserBadges(author, allProjects.hits)
  const collections = await getUserCollections(author.id)

  return (
    <div className="max-w-7xl mx-auto">
      <UserProfileHeader author={author} stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <AuthorProjectTabs
            profileBasePath={`/author/${author.id}`}
            typeStats={stats.typeStats}
            totalProjects={stats.projectCount}
            collectionCount={collections.length}
            section="collections"
          />

          <div className="mt-4">
            {collections.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {collections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold text-gray-300 mb-2">{t('author.noCollections')}</h3>
                <p className="text-gray-500">{t('author.noCollectionsHint')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <UserSidebar organizations={organizations} badges={badges} userId={author.id} />
        </div>
      </div>
    </div>
  )
}
