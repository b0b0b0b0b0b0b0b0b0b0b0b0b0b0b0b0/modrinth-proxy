import { getCatalogCollections } from '@/lib/collections'
import CollectionsCatalog from '@/app/components/CollectionsCatalog'

export const metadata = {
  title: 'Коллекции Minecraft — Featured с Modrinth',
  description: 'Каталог коллекций Minecraft: еженедельные Featured Vol. и подборки команды Modrinth.',
  robots: 'all',
  openGraph: {
    siteName: 'modrinth.black',
    type: 'website',
    title: 'Коллекции Minecraft',
    description: 'Еженедельные Featured-подборки Modrinth.',
  },
}

export default async function CollectionsPage() {
  const collections = await getCatalogCollections()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white md:text-4xl">Коллекции</h1>
        <p className="mt-2 max-w-2xl text-gray-400">
          Штатные Featured с аккаунта Modrinth: все проекты и еженедельные тома. У оригинала отдельного каталога нет — здесь он есть.
        </p>
      </div>
      <CollectionsCatalog collections={collections} />
    </div>
  )
}
