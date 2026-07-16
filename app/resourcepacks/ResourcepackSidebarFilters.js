'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMinecraftVersions } from '@/app/hooks/useMinecraftVersions'
import { RESOURCEPACK_CATEGORIES } from '@/lib/resourcepackCategories'
import { parseVersionParams, appendVersionParams } from '@/lib/catalogVersionParams'

const CATEGORIES = [
  { id: 'combat', name: 'Бой' },
  { id: 'cursed', name: 'Проклятое' },
  { id: 'decoration', name: 'Декорации' },
  { id: 'modded', name: 'Модифицированное' },
  { id: 'realistic', name: 'Реалистичное' },
  { id: 'simplistic', name: 'Минималистичное' },
  { id: 'themed', name: 'Тематическое' },
  { id: 'tweaks', name: 'Изменения' },
  { id: 'utility', name: 'Утилиты' },
  { id: 'vanilla-like', name: 'Ванильное' },
]

const RESOLUTIONS = [
  { id: '8x-', name: '8x или меньше' },
  { id: '16x', name: '16x' },
  { id: '32x', name: '32x' },
  { id: '48x', name: '48x' },
  { id: '64x', name: '64x' },
  { id: '128x', name: '128x' },
  { id: '256x', name: '256x' },
]

export default function ResourcepackSidebarFilters({ onFilterChange, isMobile = false, initialVersions = null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hookVersions = useMinecraftVersions()
  const MC_VERSIONS_RELEASE = initialVersions?.release || hookVersions.release
  const MC_VERSIONS_FULL = initialVersions?.full || hookVersions.full
  
  const parseFacets = () => {
    const fParams = searchParams.getAll('f')
    
    const categories = []
    const features = []
    const resolutions = []
    
    const categoryIds = CATEGORIES.map(c => c.id)
    const featureIds = RESOURCEPACK_CATEGORIES.map(f => f.id)
    const resolutionIds = RESOLUTIONS.map(r => r.id)
    
    const processParam = (param) => {
      if (!param) return
      let decoded = decodeURIComponent(param.replace(/\+/g, '%2B'))
      
      if (decoded.includes('categories:')) {
        const value = decoded.replace('categories:', '')
        
        if (categoryIds.includes(value)) {
          categories.push(value)
        } else if (featureIds.includes(value)) {
          features.push(value)
        } else if (resolutionIds.includes(value)) {
          resolutions.push(value)
        }
      }
    }
    
    fParams.forEach(processParam)
    
    return { categories, features, resolutions }
  }
  
  const { 
    categories: initialCategories, 
    features: initialFeatures, 
    resolutions: initialResolutions,
  } = parseFacets()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedVersions, setSelectedVersions] = useState(parseVersionParams(searchParams))
  const [selectedCategories, setSelectedCategories] = useState(initialCategories)
  const [selectedFeatures, setSelectedFeatures] = useState(initialFeatures)
  const [selectedResolutions, setSelectedResolutions] = useState(initialResolutions)
  const [showAllVersions, setShowAllVersions] = useState(false)
  const [versionSearch, setVersionSearch] = useState('')

  useEffect(() => {
    const parsedFilters = parseFacets()
    const urlQuery = searchParams.get('q') || ''
    
    setSearchQuery(urlQuery)
    setSelectedVersions(parseVersionParams(searchParams))
    setSelectedCategories(parsedFilters.categories)
    setSelectedFeatures(parsedFilters.features)
    setSelectedResolutions(parsedFilters.resolutions)
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
    
    const currentCategories = updates.c !== undefined ? updates.c : selectedCategories
    const currentFeatures = updates.feat !== undefined ? updates.feat : selectedFeatures
    const currentResolutions = updates.r !== undefined ? updates.r : selectedResolutions
    
    currentCategories.forEach(c => params.append('f', `categories:${c}`))
    currentFeatures.forEach(f => params.append('f', `categories:${f}`))
    currentResolutions.forEach(r => params.append('f', `categories:${r}`))
    
    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    
    router.push(`/resourcepacks?${params.toString()}`)
    onFilterChange?.()
  }

  const toggleVersion = (version) => {
    const next = selectedVersions.includes(version)
      ? selectedVersions.filter((v) => v !== version)
      : [...selectedVersions, version]
    setSelectedVersions(next)
    updateFilters({ v: next })
  }

  const toggleCategory = (categoryId) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(c => c !== categoryId)
      : [...selectedCategories, categoryId]
    
    setSelectedCategories(newCategories)
    updateFilters({ c: newCategories })
  }

  const toggleFeature = (featureId) => {
    const newFeatures = selectedFeatures.includes(featureId)
      ? selectedFeatures.filter(f => f !== featureId)
      : [...selectedFeatures, featureId]
    
    setSelectedFeatures(newFeatures)
    updateFilters({ feat: newFeatures })
  }

  const toggleResolution = (resolutionId) => {
    const newResolutions = selectedResolutions.includes(resolutionId)
      ? selectedResolutions.filter(r => r !== resolutionId)
      : [...selectedResolutions, resolutionId]
    
    setSelectedResolutions(newResolutions)
    updateFilters({ r: newResolutions })
  }

  return (
    <div className={isMobile ? "w-full" : "hidden lg:block w-80 flex-shrink-0"}>
      <div className="space-y-4">
        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Категории
          </h3>
          <div className="space-y-1.5 pr-2">
            {CATEGORIES.map(cat => {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Особенности
          </h3>
          <div className="space-y-1.5 pr-2">
            {RESOURCEPACK_CATEGORIES.map(feature => {
              const isSelected = selectedFeatures.includes(feature.id)
              
              return (
                <button
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                      : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="h-4 w-4 flex-shrink-0">{feature.icon}</div>
                  <span className="truncate text-sm flex-1">{feature.name}</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Разрешение
          </h3>
          <div className="space-y-1.5">
            {RESOLUTIONS.map(res => {
              const isSelected = selectedResolutions.includes(res.id)
              
              return (
                <button
                  key={res.id}
                  onClick={() => toggleResolution(res.id)}
                  className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                      : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="truncate text-sm flex-1">{res.name}</span>
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

        {(selectedVersions.length > 0 || selectedCategories.length > 0 || selectedFeatures.length > 0 || selectedResolutions.length > 0 || searchQuery) && (
          <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-3">
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedVersions([])
                setSelectedCategories([])
                setSelectedFeatures([])
                setSelectedResolutions([])
                const sort = searchParams.get('sort')
                router.push(sort ? `/resourcepacks?sort=${sort}` : '/resourcepacks')
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
