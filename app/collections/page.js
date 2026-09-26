import { getCatalogCollections } from '@/lib/collections'
import CollectionsCatalog from '@/app/components/CollectionsCatalog'
import { getRequestT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('col.seoTitle'),
    description: t('col.seoDesc'),
    robots: 'all',
    openGraph: {
      siteName: 'modrinth.black',
      type: 'website',
      title: t('col.ogTitle'),
      description: t('col.ogDesc'),
    },
  }
}

export default async function CollectionsPage() {
  const { t } = getRequestT()
  const collections = await getCatalogCollections()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white md:text-4xl">{t('col.title')}</h1>
        <p className="mt-2 max-w-2xl text-gray-400">
          {t('col.hint')}
        </p>
      </div>
      <CollectionsCatalog collections={collections} />
    </div>
  )
}
