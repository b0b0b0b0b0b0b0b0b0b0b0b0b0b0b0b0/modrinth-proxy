import FileLookupClient from './FileLookupClient'

export const metadata = {
  title: 'Поиск файла по хешу | ModrinthProxy',
  description:
    'Загрузите JAR, мод или любой файл — получите SHA512, SHA256 и SHA1, а также узнайте, есть ли этот файл на Modrinth и к какому проекту он относится.',
  robots: { index: false, follow: false },
}

export default function FileLookupPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-extrabold text-white">Поиск файла по хешу</h1>
      <p className="mb-8 text-sm text-gray-400 md:text-base">
        Загрузи файл или вставь хеш — узнаешь, какой это проект и версия на Modrinth, и есть ли обновление.
      </p>
      <FileLookupClient />
    </div>
  )
}
