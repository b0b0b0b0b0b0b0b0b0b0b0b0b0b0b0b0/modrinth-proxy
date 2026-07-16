'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMinecraftVersions } from '@/app/hooks/useMinecraftVersions'
import { MODPACK_LOADERS } from '@/lib/loaders'
import { CATEGORIES } from '@/lib/categories'
import { parseVersionParams, appendVersionParams } from '@/lib/catalogVersionParams'

const MODPACK_CATEGORIES = CATEGORIES.filter(cat => 
  ['adventure', 'challenging', 'combat', 'kitchen-sink', 'lightweight', 'magic', 'multiplayer', 'optimization', 'quests', 'technology'].includes(cat.id)
)

export default function ModpackSidebarFilters({ isMobile = false, onFilterChange, initialVersions = null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hookVersions = useMinecraftVersions()
  const MC_VERSIONS_RELEASE = initialVersions?.release || hookVersions.release
  const MC_VERSIONS_FULL = initialVersions?.full || hookVersions.full
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedVersions, setSelectedVersions] = useState(parseVersionParams(searchParams))
  const [selectedLoaders, setSelectedLoaders] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [environment, setEnvironment] = useState(searchParams.get('e') || '')
  const [openSource, setOpenSource] = useState(false)
  const [showAllVersions, setShowAllVersions] = useState(false)
  const [versionSearch, setVersionSearch] = useState('')

  useEffect(() => {
    const parsedFilters = parseFacets()
    const urlQuery = searchParams.get('q') || ''
    const urlEnvironment = searchParams.get('e') || ''
    
    setSearchQuery(urlQuery)
    setSelectedVersions(parseVersionParams(searchParams))
    setSelectedLoaders(parsedFilters.loaders)
    setSelectedCategories(parsedFilters.categories)
    setOpenSource(parsedFilters.openSource)
    setEnvironment(urlEnvironment)
  }, [searchParams])

  const parseFacets = () => {
    const loaders = []
    const categories = []
    let openSource = false

    const gParams = searchParams.getAll('g')
    gParams.forEach(param => {
      if (!param) return
      const decoded = decodeURIComponent(param)
      if (decoded.startsWith('categories:')) {
        const loaderId = decoded.substring(11)
        if (!loaders.includes(loaderId)) {
          loaders.push(loaderId)
        }
      }
    })

    const fParams = searchParams.getAll('f')
    fParams.forEach(param => {
      if (!param) return
      const decoded = decodeURIComponent(param)
      if (decoded.startsWith('categories:')) {
        const catId = decoded.substring(11)
        if (!categories.includes(catId)) {
          categories.push(catId)
        }
      }
    })

    const lParams = searchParams.getAll('l')
    lParams.forEach(param => {
      if (!param) return
      const decoded = decodeURIComponent(param)
      if (decoded === 'open_source:true') {
        openSource = true
      }
    })

    return { loaders, categories, openSource }
  }

  const updateFilters = (updates) => {
    const params = new URLSearchParams()
    
    if (updates.q !== undefined) {
      if (updates.q) params.set('q', updates.q)
    } else if (searchQuery) {
      params.set('q', searchQuery)
    }
    
    if (updates.v !== undefined) {
      appendVersionParams(params, updates.v)
    } else {
      appendVersionParams(params, parseVersionParams(searchParams))
    }

    const finalLoaders = updates.l !== undefined ? updates.l : selectedLoaders
    finalLoaders.forEach(loader => {
      params.append('g', `categories:${loader}`)
    })

    const finalCategories = updates.c !== undefined ? updates.c : selectedCategories
    finalCategories.forEach(cat => {
      params.append('f', `categories:${cat}`)
    })

    const finalEnv = updates.e !== undefined ? updates.e : environment
    if (finalEnv) {
      params.set('e', finalEnv)
    }

    const finalOpenSource = updates.os !== undefined ? updates.os : openSource
    if (finalOpenSource) {
      params.append('l', 'open_source:true')
    }
    
    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    
    router.push(`/modpacks?${params.toString()}`)
    onFilterChange?.()
  }

  const toggleVersion = (version) => {
    const next = selectedVersions.includes(version)
      ? selectedVersions.filter((v) => v !== version)
      : [...selectedVersions, version]
    setSelectedVersions(next)
    updateFilters({ v: next })
  }

  const toggleLoader = (loaderId) => {
    const newLoaders = selectedLoaders.includes(loaderId)
      ? selectedLoaders.filter(l => l !== loaderId)
      : [...selectedLoaders, loaderId]
    setSelectedLoaders(newLoaders)
    updateFilters({ l: newLoaders })
  }

  const toggleCategory = (categoryId) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(c => c !== categoryId)
      : [...selectedCategories, categoryId]
    setSelectedCategories(newCategories)
    updateFilters({ c: newCategories })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateFilters({ q: searchQuery })
  }

  return (
    <div className={isMobile ? "w-full" : "hidden lg:block w-80 flex-shrink-0"}>
      <div className="space-y-4">
        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Категории</h3>
          <div className="space-y-1.5 pr-2">
            {MODPACK_CATEGORIES.map(cat => {
              const isSelected = selectedCategories.includes(cat.id)
              
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                      : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="h-4 w-4">{cat.icon}</div>
                  <span className="truncate text-sm flex-1">{cat.name}</span>
                  {isSelected && (
                    <svg className="h-4 w-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Окружение</h3>
          <div className="space-y-1.5">
            <button
              onClick={() => {
                const newEnv = environment === 'client' ? '' : 'client'
                setEnvironment(newEnv)
                updateFilters({ e: newEnv })
              }}
              className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                environment === 'client'
                  ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                  : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17 9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2"/>
              </svg>
              <span className="truncate text-sm flex-1">Клиент</span>
              {environment === 'client' && (
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                const newEnv = environment === 'server' ? '' : 'server'
                setEnvironment(newEnv)
                updateFilters({ e: newEnv })
              }}
              className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                environment === 'server'
                  ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                  : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M22 12H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11M6 16h.01M10 16h.01"/>
              </svg>
              <span className="truncate text-sm flex-1">Сервер</span>
              {environment === 'server' && (
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Версия игры
          </h3>
          
          <div className="mb-2 relative">
            <input
              type="text"
              placeholder="Поиск..."
              value={versionSearch}
              onChange={(e) => setVersionSearch(e.target.value)}
              className="w-full px-3 py-2 pl-9 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-modrinth-green transition-colors"
            />
            <svg 
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />
            </svg>
          </div>

          <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar pr-2 mb-2">
            {(() => {
              const versions = showAllVersions ? MC_VERSIONS_FULL : MC_VERSIONS_RELEASE
              const filteredVersions = versionSearch
                ? versions.filter(v => v.toLowerCase().includes(versionSearch.toLowerCase()))
                : versions
              
              return filteredVersions.map(version => {
                const isSelected = selectedVersions.includes(version)
                return (
                <button
                  key={version}
                  onClick={() => toggleVersion(version)}
                  className={`w-full text-left px-3 py-1.5 rounded-full text-sm transition-all group flex items-center justify-between ${
                    isSelected
                      ? 'bg-modrinth-green text-black font-semibold'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>{version}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )})
            })()}
          </div>

          <div className="pt-2 border-t border-gray-800">
            <button
              onClick={() => setShowAllVersions(!showAllVersions)}
              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800 rounded transition-colors group"
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                showAllVersions 
                  ? 'bg-modrinth-green border-modrinth-green' 
                  : 'border-gray-600 group-hover:border-gray-500'
              }`}>
                {showAllVersions && (
                  <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                Показать все версии
              </span>
            </button>
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Загрузчик</h3>
          <div className="space-y-1.5">
            {MODPACK_LOADERS.map(loader => {
              const isSelected = selectedLoaders.includes(loader.id)
              
              return (
                <button
                  key={loader.id}
                  onClick={() => toggleLoader(loader.id)}
                  className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                      : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="h-4 w-4">{loader.icon}</div>
                  <span className="truncate text-sm flex-1">{loader.name}</span>
                  {isSelected && (
                    <svg className="h-4 w-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Прочее</h3>
          <button
            onClick={() => {
              const newOpenSource = !openSource
              setOpenSource(newOpenSource)
              updateFilters({ os: newOpenSource })
            }}
            className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              openSource
                ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="truncate text-sm flex-1">Открытый исходный код</span>
            {openSource && (
              <svg className="h-4 w-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </button>
        </div>

        {(selectedVersions.length > 0 || selectedLoaders.length > 0 || selectedCategories.length > 0 || environment || openSource || searchQuery) && (
          <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-3">
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedVersions([])
                setSelectedLoaders([])
                setSelectedCategories([])
                setEnvironment('')
                setOpenSource(false)
                const sort = searchParams.get('sort')
                router.push(sort ? `/modpacks?sort=${sort}` : '/modpacks')
              }}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-red-600/30 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
