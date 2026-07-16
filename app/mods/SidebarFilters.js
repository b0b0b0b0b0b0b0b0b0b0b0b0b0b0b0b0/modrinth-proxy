'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMinecraftVersions } from '@/app/hooks/useMinecraftVersions'
import { MOD_LOADERS, MAIN_LOADERS_COUNT } from '@/lib/loaders'
import { CATEGORIES } from '@/lib/categories'
import { parseVersionParams, appendVersionParams } from '@/lib/catalogVersionParams'

const MOD_CATEGORIES = CATEGORIES.filter(cat =>
  ['adventure', 'cursed', 'decoration', 'economy', 'equipment', 'food', 'game-mechanics', 'library', 'magic', 'management', 'minigame', 'mobs', 'optimization', 'social', 'storage', 'technology', 'transportation', 'utility', 'worldgen'].includes(cat.id)
)

const ENVIRONMENTS = [
  { id: 'client', name: 'Клиент' },
  { id: 'server', name: 'Сервер' },
]

export default function SidebarFilters({ onFilterChange, isMobile = false, initialVersions = null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hookVersions = useMinecraftVersions()
  const MC_VERSIONS_RELEASE = initialVersions?.release || hookVersions.release
  const MC_VERSIONS_FULL = initialVersions?.full || hookVersions.full
  
  const parseFacets = () => {
    const gParams = searchParams.getAll('g')
    const fParams = searchParams.getAll('f')
    const loaders = []
    const categories = []
    
    gParams.forEach(param => {
      if (!param) return
      const decoded = decodeURIComponent(param)
      if (decoded.includes('categories:')) {
        const value = decoded.replace('categories:', '')
        loaders.push(value)
      }
    })
    
    fParams.forEach(param => {
      if (!param) return
      const decoded = decodeURIComponent(param)
      if (decoded.includes('categories:')) {
        const value = decoded.replace('categories:', '')
        categories.push(value)
      }
    })
    
    return { loaders, categories, versions: parseVersionParams(searchParams) }
  }
  
  const { loaders: initialLoaders, categories: initialCategories, versions: initialVersionsSelected } = parseFacets()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedVersions, setSelectedVersions] = useState(initialVersionsSelected)
  const [selectedLoaders, setSelectedLoaders] = useState(initialLoaders)
  const [selectedCategories, setSelectedCategories] = useState(initialCategories)
  const [selectedEnvironment, setSelectedEnvironment] = useState(searchParams.get('e') || '')
  const [showAllVersions, setShowAllVersions] = useState(false)
  const [versionSearch, setVersionSearch] = useState('')
  const [showAllLoaders, setShowAllLoaders] = useState(false)

  useEffect(() => {
    const parsedFilters = parseFacets()
    const urlQuery = searchParams.get('q') || ''
    const urlEnvironment = searchParams.get('e') || ''
    
    setSearchQuery(urlQuery)
    setSelectedVersions(parsedFilters.versions)
    setSelectedLoaders(parsedFilters.loaders)
    setSelectedCategories(parsedFilters.categories)
    setSelectedEnvironment(urlEnvironment)
  }, [searchParams])

  const updateFilters = (updates) => {
    const params = new URLSearchParams()
    
    if (updates.q !== undefined) {
      if (updates.q) params.set('q', updates.q)
    } else {
      const q = searchParams.get('q')
      if (q) params.set('q', q)
    }
    
    if (updates.v !== undefined) {
      appendVersionParams(params, updates.v)
    } else {
      appendVersionParams(params, parseVersionParams(searchParams))
    }
    
    const currentLoaders = updates.l !== undefined ? updates.l : selectedLoaders
    const currentCategories = updates.c !== undefined ? updates.c : selectedCategories
    
    currentLoaders.forEach(l => params.append('g', `categories:${l}`))
    currentCategories.forEach(c => params.append('f', `categories:${c}`))
    
    if (updates.e !== undefined) {
      if (updates.e) params.set('e', updates.e)
    } else {
      const e = searchParams.get('e')
      if (e) params.set('e', e)
    }
    
    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    
    router.push(`/mods?${params.toString()}`)
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
    let newLoaders = [...selectedLoaders]
    
    if (newLoaders.includes(loaderId)) {
      newLoaders = newLoaders.filter(l => l !== loaderId)
    } else {
      newLoaders.push(loaderId)
    }
    
    setSelectedLoaders(newLoaders)
    updateFilters({ l: newLoaders })
  }

  const toggleCategory = (categoryId) => {
    let newCategories = [...selectedCategories]
    
    if (newCategories.includes(categoryId)) {
      newCategories = newCategories.filter(c => c !== categoryId)
    } else {
      newCategories.push(categoryId)
    }
    
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
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            Загрузчик
          </h3>
          <div className="flex flex-col gap-1">
            {(showAllLoaders ? MOD_LOADERS : MOD_LOADERS.slice(0, MAIN_LOADERS_COUNT)).map(loader => {
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
                  <div className="h-4 w-4 flex-shrink-0">{loader.icon}</div>
                  <span className="truncate text-sm flex-1">{loader.name}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
            {MOD_LOADERS.length > MAIN_LOADERS_COUNT && (
              <button
                onClick={() => setShowAllLoaders(!showAllLoaders)}
                className="text-sm text-gray-400 hover:text-white transition-colors py-2 text-left font-semibold"
              >
                {showAllLoaders ? 'Показать меньше' : 'Показать больше'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Категории
          </h3>
          <div className="flex flex-col gap-1 pr-2">
            {MOD_CATEGORIES.map(cat => {
              const isSelected = selectedCategories.includes(cat.id)
              
              return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                      : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="h-4 w-4 flex-shrink-0">{cat.icon}</div>
                  <span className="truncate text-sm flex-1">{cat.name}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            Окружение
          </h3>
          <div className="space-y-2">
            {ENVIRONMENTS.map(env => (
              <button
                key={env.id}
                onClick={() => {
                  const newEnv = selectedEnvironment === env.id ? '' : env.id
                  setSelectedEnvironment(newEnv)
                  updateFilters({ e: newEnv })
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedEnvironment === env.id
                    ? 'bg-modrinth-green text-black font-semibold'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {env.name}
              </button>
            ))}
          </div>
        </div>

        {(selectedVersions.length > 0 || selectedLoaders.length > 0 || selectedCategories.length > 0 || selectedEnvironment || searchQuery) && (
          <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-3">
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedVersions([])
              setSelectedLoaders([])
              setSelectedCategories([])
              setSelectedEnvironment('')
              const sort = searchParams.get('sort')
              router.push(sort ? `/mods?sort=${sort}` : '/mods')
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
