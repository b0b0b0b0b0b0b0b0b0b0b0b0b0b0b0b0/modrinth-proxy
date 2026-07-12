import FileLookupClient from './FileLookupClient'

export const metadata = {
  title: 'File lookup — поиск файла по хешу | ModrinthProxy',
  description:
    'Загрузите JAR, мод или любой файл — получите SHA512, SHA256 и SHA1, а также узнайте, есть ли этот файл на Modrinth и к какому проекту он относится.',
}

export default function FileLookupPage() {
  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 pt-4 text-center animate-fade-in">
          <h1 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            File lookup
          </h1>
          <p className="mx-auto max-w-2xl text-gray-400 md:text-lg leading-relaxed">
            Загрузите файл или вставьте хеш — получите SHA512, SHA256 и SHA1, а также узнайте,
            какой это проект и версия на Modrinth.
          </p>
        </div>

        <div className="animate-fade-in-up">
          <FileLookupClient />
        </div>
      </div>
    </div>
  )
}
