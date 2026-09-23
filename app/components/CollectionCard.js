import Link from 'next/link'

function projectCountLabel(count) {
  const n = Number(count) || 0
  if (n === 1) return '1 проект'
  if (n > 1 && n < 5) return `${n} проекта`
  return `${n} проектов`
}

export default function CollectionCard({ collection }) {
  const count = collection.projects?.length || 0
  return (
    <Link
      href={`/collection/${collection.id}`}
      className="group flex gap-4 rounded-xl border border-gray-800 bg-modrinth-dark p-4 text-inherit no-underline outline-none transition-colors hover:border-[rgba(var(--color-green-rgb),0.4)] hover:bg-[rgba(var(--color-green-rgb),0.08)]"
    >
      {collection.icon_url ? (
        <img
          src={collection.icon_url}
          alt=""
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold text-white transition-colors group-hover:text-modrinth-green">{collection.name}</h3>
        {collection.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-gray-400">{collection.description}</p>
        ) : null}
        <p className="mt-2 text-sm text-gray-500">{projectCountLabel(count)}</p>
      </div>
    </Link>
  )
}
