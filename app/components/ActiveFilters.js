'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getFilterConfig, getCategoryName, getLoaderName, getPlatformName, getEnvironmentName } from '@/lib/filterConfig'
import { SERVER_REGIONS, SERVER_LANGUAGES } from '@/lib/serverCategories'

export default function ActiveFilters({ categoryPath = 'plugins' }) {
  const searchParams = useSearchParams()
  const config = getFilterConfig(categoryPath)
  const activeFilters = []
  const scParams = Array.isArray(searchParams.getAll('sc')) ? searchParams.getAll('sc') : (searchParams.get('sc') ? [searchParams.get('sc')] : [])
  scParams.forEach(param => {
    if (!param) return
    if (config.categories && config.categories.some(cat => cat.id === param)) {
      activeFilters.push({
        type: 'sc',
        id: param,
        label: getCategoryName(param, config),
        param: param
      })
    }
  })

  const sctParams = Array.isArray(searchParams.getAll('sct')) ? searchParams.getAll('sct') : (searchParams.get('sct') ? [searchParams.get('sct')] : [])
  sctParams.forEach(param => {
    if (!param) return
    const id = param === 'vanilla' ? 'vanilla-like' : 'modded'
    if (config.categories && config.categories.some(cat => cat.id === id)) {
      activeFilters.push({
        type: 'sct',
        id: param,
        label: getCategoryName(id, config),
        param: param
      })
    }
  })

  const fParams = Array.isArray(searchParams.getAll('f')) ? searchParams.getAll('f') : (searchParams.get('f') ? [searchParams.get('f')] : [])
  fParams.forEach(param => {
    if (!param) return
    const decoded = decodeURIComponent(param)
    if (decoded.startsWith('categories:')) {
      const categoryId = decoded.substring(11)
      if (config.categories && config.categories.some(cat => cat.id === categoryId)) {
        if (!activeFilters.some(f => f.type === 'sc' && f.id === categoryId)) {
          activeFilters.push({
            type: 'category',
            id: categoryId,
            label: getCategoryName(categoryId, config),
            param: param
          })
        }
      }
    }
  })
  
  const gParams = Array.isArray(searchParams.getAll('g')) ? searchParams.getAll('g') : (searchParams.get('g') ? [searchParams.get('g')] : [])
  gParams.forEach(param => {
    if (!param) return
    const decoded = decodeURIComponent(param)
    if (decoded.startsWith('categories:')) {
      const id = decoded.substring(11)
      const isPlatform = config.platforms && config.platforms.some(p => p.id === id)
      const isLoader = config.loaders && config.loaders.some(l => l.id === id)
      
      if (isPlatform || isLoader) {
        activeFilters.push({
          type: isPlatform ? 'platform' : 'loader',
          id: id,
          label: isPlatform ? getPlatformName(id, config) : getLoaderName(id, config),
          param: param
        })
      }
    }
  })
  
  const sgv = searchParams.get('sgv')
  if (sgv) {
    activeFilters.push({
      type: 'sgv',
      id: sgv,
      label: sgv,
      param: 'sgv'
    })
  }

  const versions = searchParams.getAll('v').filter(Boolean)
  versions.forEach((v) => {
    activeFilters.push({
      type: 'version',
      id: v,
      label: v,
      param: v,
    })
  })
  
  if (config.hasOpenSource) {
    const lParams = Array.isArray(searchParams.getAll('l')) ? searchParams.getAll('l') : (searchParams.get('l') ? [searchParams.get('l')] : [])
    lParams.forEach(param => {
      if (!param) return
      const decoded = decodeURIComponent(param)
      if (decoded === 'open_source:true') {
        activeFilters.push({
          type: 'openSource',
          id: 'open_source',
          label: 'Открытый исходный код',
          param: param
        })
      }
    })
  }
  
  if (config.hasEnvironment) {
    const environment = searchParams.get('e')
    if (environment && (environment === 'client' || environment === 'server')) {
      activeFilters.push({
        type: 'environment',
        id: environment,
        label: getEnvironmentName(environment),
        param: 'e'
      })
    }
  }
  
  const isServer = categoryPath === 'discover/servers' || categoryPath === 'servers'
  if (isServer) {
    const srParams = Array.isArray(searchParams.getAll('sr')) ? searchParams.getAll('sr') : (searchParams.get('sr') ? [searchParams.get('sr')] : [])
    srParams.forEach(param => {
      if (!param) return
      const regionObj = SERVER_REGIONS.find(r => r.id === param)
      if (regionObj) {
        activeFilters.push({
          type: 'sr',
          id: param,
          label: regionObj.name,
          param: param
        })
      }
    })

    const slParams = Array.isArray(searchParams.getAll('sl')) ? searchParams.getAll('sl') : (searchParams.get('sl') ? [searchParams.get('sl')] : [])
    slParams.forEach(param => {
      if (!param) return
      const langObj = SERVER_LANGUAGES.find(l => l.id === param)
      if (langObj) {
        activeFilters.push({
          type: 'sl',
          id: param,
          label: langObj.name,
          param: param
        })
      }
    })

    const sst = searchParams.get('sst')
    if (sst === 'offline') {
      activeFilters.push({
        type: 'sst',
        id: sst,
        label: 'Не в сети',
        param: sst
      })
    }
  }
  
  if (activeFilters.length === 0) {
    return null
  }
  
  const buildUrlWithoutFilter = (filterToRemove) => {
    const params = new URLSearchParams()
    const processedKeys = new Set()
    
    searchParams.forEach((value, key) => {
      if (key === 'page') return
      if (processedKeys.has(key)) return
      processedKeys.add(key)
      
      if (filterToRemove.type === 'sgv' && key === 'sgv') return
      if (filterToRemove.type === 'environment' && key === 'e') return
      if (filterToRemove.type === 'sst' && key === 'sst') {
        params.set('sst', 'online')
        return
      }
      
      if ((filterToRemove.type === 'category' && key === 'f') || 
          (filterToRemove.type === 'sc' && key === 'sc') ||
          (filterToRemove.type === 'sct' && key === 'sct') ||
          (filterToRemove.type === 'sr' && key === 'sr') ||
          (filterToRemove.type === 'sl' && key === 'sl') ||
          ((filterToRemove.type === 'platform' || filterToRemove.type === 'loader') && key === 'g') ||
          (filterToRemove.type === 'openSource' && key === 'l') ||
          (filterToRemove.type === 'version' && key === 'v')) {
        const allValues = searchParams.getAll(key)
        const filteredValues = allValues.filter(v => v !== filterToRemove.param)
        const uniqueValues = [...new Set(filteredValues)]
        uniqueValues.forEach(v => params.append(key, v))
      } else {
        const allValues = searchParams.getAll(key)
        const uniqueValues = [...new Set(allValues)]
        if (uniqueValues.length === 1) {
          params.set(key, uniqueValues[0])
        } else if (uniqueValues.length > 1) {
          uniqueValues.forEach(v => params.append(key, v))
        }
      }
    })
    
    return `/${categoryPath}?${params.toString()}`
  }
  
  const clearAllUrl = () => {
    const params = new URLSearchParams()
    const query = searchParams.get('q')
    const sort = searchParams.get('sort')
    
    if (query) params.set('q', query)
    if (sort && sort !== 'relevance') {
      params.set('sort', sort)
    }
    
    if (categoryPath === 'discover/servers' || categoryPath === 'servers') {
      params.set('sst', 'online')
    }
    
    return `/${categoryPath}?${params.toString()}`
  }
  
  return (
    <div className="flex flex-wrap items-center gap-1 empty:hidden">
      {activeFilters.length >= 2 && (
        <Link
          href={clearAllUrl()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-white px-2 py-1 leading-none rounded-full font-semibold text-sm inline-flex items-center gap-1 transition-colors border-none active:scale-[0.95] cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m15 9-6 6M9 9l6 6"></path>
          </svg>
          Очистить фильтры
        </Link>
      )}
      
      {activeFilters.map((filter, index) => (
        <Link
          key={`${filter.type}-${filter.id}-${index}`}
          href={buildUrlWithoutFilter(filter)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-white px-2 py-1 leading-none rounded-full font-semibold text-sm inline-flex items-center gap-1 transition-colors border-none active:scale-[0.95] cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4 shrink-0">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414" clipRule="evenodd"></path>
          </svg>
          {filter.label}
        </Link>
      ))}
    </div>
  )
}
