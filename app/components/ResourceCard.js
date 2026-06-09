import Link from 'next/link'
import { formatDownloads, modrinthHoverAccentHex } from '@/lib/modrinth'
import { getPublicUsername } from '@/lib/contentFilter'
import { CATEGORIES } from '@/lib/categories'
import { LOADERS } from '@/lib/loaders'
import { RESOURCEPACK_CATEGORIES } from '@/lib/resourcepackCategories'
import { SHADER_STYLES, SHADER_FEATURES, SHADER_PERFORMANCE } from '@/lib/shaderCategories'
import { SERVER_CATEGORIES, SERVER_REGIONS } from '@/lib/serverCategories'
import { IconModrinthAppPlays } from '@/lib/icons'
import RelativeTime from './RelativeTime'

function uniqueStrings(list) {
  if (!Array.isArray(list)) return []
  return [...new Set(list)]
}

export default function ResourceCard({ resource, type = 'mod', forceLayout = null }) {
  const typeMap = {
    'mod': 'mod',
    'plugin': 'plugin',
    'shader': 'shader',
    'resourcepack': 'resourcepack',
    'datapack': 'datapack',
    'modpack': 'modpack',
    'minecraft_java_server': 'server',
    'servers': 'server',
    'server': 'server'
  }

  const basePath = typeMap[type] || 'mod'

  const getCategoryIcon = (categoryId) => {
    const allCategories = [
      ...CATEGORIES,
      ...LOADERS,
      ...RESOURCEPACK_CATEGORIES,
      ...SHADER_STYLES,
      ...SHADER_FEATURES,
      ...SHADER_PERFORMANCE,
      ...SERVER_CATEGORIES
    ]
    
    const cat = allCategories.find(c => c.id === categoryId)
    return cat ? { icon: cat.icon, name: cat.name } : null
  }

  const loaderIds = LOADERS.map(l => l.id)
  const shouldShowCategory = (catId) => {
    if (catId === type || catId === `${type}s`) return false
    
    if (catId === 'datapack') return false
    
    if (type === 'datapack' && loaderIds.includes(catId)) return false
    
    return true
  }

  const getEnvironment = (clientSide, serverSide) => {
    if (!clientSide && !serverSide) return null
    
    const client = clientSide === 'required' || clientSide === 'optional'
    const server = serverSide === 'required' || serverSide === 'optional'
    
    if (client && server) return { type: 'both', label: 'Клиент или сервер' }
    if (client) return { type: 'client', label: 'Клиент' }
    if (server) return { type: 'server', label: 'Сервер' }
    
    return null
  }

  const getEnvironmentIcon = (envType) => {
    if (envType === 'both') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10"></path>
        </svg>
      )
    }
    if (envType === 'client') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17 9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2"></path>
        </svg>
      )
    }
    if (envType === 'server') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22 12H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11M6 16h.01M10 16h.01"></path>
        </svg>
      )
    }
    return null
  }

  const environment = getEnvironment(resource.client_side, resource.server_side)
  const showEnvironment = ['mod', 'plugin', 'modpack'].includes(type) && environment

  const pluginTitleHoverAccent =
    type === 'plugin' ? modrinthHoverAccentHex(resource.color) : null

  const activeLayout = forceLayout || ((type === 'resourcepack' || type === 'shader') ? 'grid' : 'rows')

  if (activeLayout === 'grid') {
    const pickUrl = (entry) =>
      typeof entry === 'string' && entry
        ? entry
        : entry?.url || entry?.raw_url || null

    const galleryFeatured =
      resource.gallery?.find((e) => e && (e.featured === true || e.featured === 'true')) ?? null

    const fromMarkedFeatured = pickUrl(galleryFeatured)

    const rootFeatured =
      typeof resource.featured_gallery === 'string' && resource.featured_gallery.trim()
        ? resource.featured_gallery.trim()
        : null

    const gallery0 = resource.gallery?.[0]
    const galleryFirstUrl = pickUrl(gallery0)

    const packPreview = fromMarkedFeatured || rootFeatured || galleryFirstUrl
    const href = `/${basePath}/${resource.slug}`

    return (
      <Link
        href={href}
        className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
      >
        <article className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-800 bg-modrinth-dark">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-modrinth-darker">
            {packPreview ? (
              <img
                src={packPreview}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : resource.icon_url ? (
              <img
                src={resource.icon_url}
                alt=""
                className="absolute inset-0 m-auto h-20 w-20 object-contain opacity-80"
                loading="lazy"
              />
            ) : null}
            {packPreview && resource.icon_url && (
              <img
                src={resource.icon_url}
                alt=""
                className="absolute bottom-2 left-2 h-11 w-11 rounded-lg border border-white/15 bg-black/45 object-cover shadow-lg ring-1 ring-black/40 backdrop-blur-[2px]"
                loading="lazy"
              />
            )}
          </div>
          <div className="flex flex-1 flex-col p-3">
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-white transition-colors group-hover:text-modrinth-green">
              {resource.title}
            </h3>
            <p className="mt-1 text-xs text-gray-500">от {getPublicUsername(resource.author, resource.author_id)}</p>
            <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-400">{resource.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {uniqueStrings(resource.display_categories).slice(0, 3).map((catId) => {
                const categoryData = getCategoryIcon(catId)
                if (!categoryData) {
                  return (
                    <span
                      key={catId}
                      className="rounded-full bg-gray-800/90 px-2 py-0.5 text-[11px] text-gray-400"
                    >
                      {catId}
                    </span>
                  )
                }
                return (
                  <span
                    key={catId}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-800/90 px-2 py-0.5 text-[11px] text-gray-400"
                    title={categoryData.name}
                  >
                    <span className="flex h-3 w-3 shrink-0 items-center justify-center">{categoryData.icon}</span>
                    {categoryData.name}
                  </span>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-800/80 pt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1 text-gray-400">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <strong className="font-semibold text-gray-300">{formatDownloads(resource.downloads)}</strong>
              </span>
              {(resource.date_modified || resource.updated) && (
                <RelativeTime dateString={resource.date_modified || resource.updated} />
              )}
            </div>
          </div>
        </article>
      </Link>
    )
  }

  const isServer = basePath === 'server'

  if (isServer) {
    const pingObj = resource.minecraft_java_server?.ping
    const ping = pingObj?.data
    const playersOnline = ping?.players_online ?? pingObj?.players_online ?? null
    const plays2w = resource.minecraft_java_server?.verified_plays_2w ?? null
    const plays4w = resource.minecraft_java_server?.verified_plays_4w ?? null
    const serverRegion = resource.minecraft_server?.region ?? null
    const regionData = serverRegion ? SERVER_REGIONS.find(r => r.id === serverRegion) : null
    const hasPingInfo = pingObj !== undefined && pingObj !== null
    const isOffline = hasPingInfo && (ping === null || ping === undefined)

    const serverCats = uniqueStrings((resource.display_categories || resource.categories || []))
      .filter(c => c !== 'minecraft_java_server')
      .slice(0, 3)
      .map(catId => getCategoryIcon(catId))
      .filter(Boolean)

    return (
      <div className="bg-modrinth-dark border border-gray-800 rounded-lg p-3 md:p-4 flex items-start gap-3 md:gap-4">
        {resource.icon_url && (
          <img
            src={resource.icon_url}
            alt={resource.title}
            className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-baseline gap-2 flex-wrap">
            <Link href={`/${basePath}/${resource.slug}`}>
              <h3 className="text-lg md:text-xl font-bold transition-colors cursor-pointer hover:text-modrinth-green">
                {resource.title}
              </h3>
            </Link>
          </div>
          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{resource.description}</p>
          <div className="flex flex-wrap gap-1.5 items-center">
            {regionData && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800/80 border border-gray-700/50 rounded-full text-xs text-gray-300">
                <svg className="w-3 h-3 text-cyan-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {regionData.name}
              </span>
            )}
            {serverCats.map(cat => (
              <span
                key={cat.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800/80 border border-gray-700/50 rounded-full text-xs text-gray-300"
              >
                <span className="w-3 h-3 shrink-0">{cat.icon}</span>
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden md:flex flex-col justify-between items-end text-right flex-shrink-0 min-w-[120px] self-stretch">
          <div className="flex flex-col gap-2.5 items-end">
            {playersOnline !== null ? (
              <div className="inline-flex items-center gap-2 font-semibold bg-modrinth-green/10 px-3 py-1.5 rounded-xl">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-modrinth-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-modrinth-green"></span>
                </span>
                <span className="text-base leading-none tabular-nums">
                  <span className="text-white font-bold">{playersOnline.toLocaleString('ru-RU')}</span>
                  <span className="text-modrinth-green ml-1.5 text-sm font-medium">в сети</span>
                </span>
              </div>
            ) : isOffline ? (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gray-600 flex-shrink-0"></span>
                <span className="text-xs text-gray-500">офлайн</span>
              </div>
            ) : null}

            {(plays2w !== null || plays4w !== null) && (
              <div className="flex items-center gap-1.5 text-gray-400">
                <IconModrinthAppPlays className="w-5 h-5 shrink-0 text-gray-400 -rotate-45" />
                <div className="flex flex-col gap-0.5">
                  {plays2w !== null && (
                    <span className="text-sm leading-tight">
                      <strong className="text-white">{plays2w.toLocaleString('ru-RU')}</strong>
                      <span className="text-gray-500 ml-1 text-xs">за 2 нед.</span>
                    </span>
                  )}
                  {plays4w !== null && (
                    <span className="text-sm leading-tight">
                      <strong className="text-white">{plays4w.toLocaleString('ru-RU')}</strong>
                      <span className="text-gray-500 ml-1 text-xs">за мес.</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-modrinth-dark border border-gray-800 rounded-lg p-3 md:p-4 flex items-start gap-3 md:gap-4">
      {resource.icon_url && (
        <img
          src={resource.icon_url}
          alt={resource.title}
          className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover flex-shrink-0"
        />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-baseline gap-2 flex-wrap">
          <Link href={`/${basePath}/${resource.slug}`}>
            <h3
              className={`text-lg md:text-xl font-bold transition-colors cursor-pointer ${
                pluginTitleHoverAccent
                  ? 'hover:text-[color:var(--plugin-title-hover)]'
                  : 'hover:text-modrinth-green'
              }`}
              style={
                pluginTitleHoverAccent
                  ? { '--plugin-title-hover': pluginTitleHoverAccent }
                  : undefined
              }
            >
              {resource.title}
            </h3>
          </Link>
          <span className="text-xs text-gray-500">от {getPublicUsername(resource.author, resource.author_id)}</span>
        </div>
        <p className="text-sm text-gray-400 mb-2">
          {resource.description}
        </p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {showEnvironment && (
            <div className="flex items-center gap-1 px-2 py-0.5 text-gray-300">
              <div className="w-4 h-4 flex items-center justify-center">
                {getEnvironmentIcon(environment.type)}
              </div>
              <span className="text-xs font-semibold">{environment.label}</span>
            </div>
          )}
          {resource.categories &&
            uniqueStrings(resource.categories.filter(shouldShowCategory))
            .slice(0, 4)
            .map((catId) => {
            const categoryData = getCategoryIcon(catId)
            if (!categoryData) {
              return (
                <span
                  key={catId}
                  className="text-xs px-2 py-0.5 bg-gray-800 rounded-full text-gray-400"
                >
                  {catId}
                </span>
              )
            }
            
            return (
              <div
                key={catId}
                className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded-full text-gray-400 hover:bg-gray-700 transition-colors"
                title={categoryData.name}
              >
                <div className="w-3 h-3">
                  {categoryData.icon}
                </div>
                <span className="text-xs">{categoryData.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="hidden md:flex flex-col justify-between items-end text-right flex-shrink-0 min-w-[110px] self-stretch">
        <div className="flex flex-col gap-2.5 items-end">
          <div className="flex items-center gap-1.5 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <p className="text-sm">
              <strong className="text-white">{formatDownloads(resource.downloads)}</strong>
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0" />
            </svg>
            <p className="text-sm">
              <strong className="text-white">{formatDownloads(resource.follows || resource.followers)}</strong>
            </p>
          </div>
        </div>
        
        {(resource.date_modified || resource.updated) && (
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            <RelativeTime dateString={resource.date_modified || resource.updated} />
          </div>
        )}
      </div>
    </div>
  )
}



