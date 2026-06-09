import Link from 'next/link'
import { buildCatalogSearchUrl, formatCatalogCount } from '@/lib/catalogCrossSearch'

const CATALOG_ROW_STYLE = {
  mods: 'bg-modrinth-green/15 text-modrinth-green border-modrinth-green/30 hover:bg-modrinth-green/25',
  plugins: 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25',
  shaders: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25',
  resourcepacks: 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25',
  datapacks: 'bg-orange-500/15 text-orange-300 border-orange-500/30 hover:bg-orange-500/25',
  modpacks: 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25',
}

export default function CatalogSearchAlternatives({
  query,
  categoryPath,
  version,
  catalogKey,
  alternatives = [],
}) {
  if (!alternatives.length || !catalogKey) return null

  return (
    <article className="bg-modrinth-dark border border-gray-800 rounded-lg p-4 md:p-6">
      <p className="text-lg md:text-xl text-gray-400 mb-5">
        Такс... короче я обошёл вболь и поперк. это точно тот раздел?
        <br />
        Я нашёл в других разделах, смотри:
      </p>
      <ul className="space-y-3">
        {alternatives.map((alt) => {
          const pillStyle =
            CATALOG_ROW_STYLE[alt.key] ||
            'bg-gray-500/15 text-gray-200 border-gray-500/30 hover:bg-gray-500/25'

          return (
            <li key={alt.key}>
              <Link
                href={buildCatalogSearchUrl(categoryPath, alt.key, query, version)}
                className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 transition-colors"
              >
                <span
                  className={`inline-block px-3 py-1 rounded-lg border font-semibold text-base transition-colors ${pillStyle}`}
                >
                  {alt.label}
                </span>
                <span className="text-gray-500 text-sm">
                  {formatCatalogCount(alt.totalHits, alt.noun)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
