'use client'

import { useMemo, useState } from 'react'
import CollectionCard from './CollectionCard'
import { useT } from './I18nProvider'

export default function CollectionsCatalog({ collections }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return collections
    return collections.filter((collection) => {
      const name = String(collection.name || '').toLowerCase()
      const description = String(collection.description || '').toLowerCase()
      return name.includes(needle) || description.includes(needle)
    })
  }, [collections, query])

  return (
    <div>
      <div className="relative mb-6 max-w-xl">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('col.search')}
          className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:border-modrinth-green focus:outline-none"
        />
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />
        </svg>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <h3 className="text-xl font-semibold text-gray-300">{t('col.empty')}</h3>
          <p className="mt-2 text-gray-500">{t('col.emptyHint')}</p>
        </div>
      )}
    </div>
  )
}
