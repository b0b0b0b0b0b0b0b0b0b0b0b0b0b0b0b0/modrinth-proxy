'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SortDropdown({
  currentSort = 'relevance',
  query = '',
  version = '',
  categoryPath = 'mods',
  searchParams = {}
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter()

  const isServer = categoryPath === 'discover/servers'
  
  const sortOptions = isServer ? [
    { value: 'relevance', label: 'Релевантность' },
    { value: 'plays', label: 'Запуски' },
    { value: 'players', label: 'Игроки онлайн' },
    { value: 'followers', label: 'Подписчики' },
    { value: 'created', label: 'Дата публикации' },
    { value: 'updated', label: 'Дата обновления' },
  ] : [
    { value: 'relevance', label: 'Релевантность' },
    { value: 'downloads', label: 'Скачивания' },
    { value: 'newest', label: 'Дата публикации' },
    { value: 'updated', label: 'Последнее обновление' },
    { value: 'follows', label: 'Подписчики' },
  ]

  const currentOption = sortOptions.find(opt => opt.value === currentSort) || sortOptions[0]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (value) => {
    const params = new URLSearchParams()
    
    if (isServer) {
      if (query) params.set('q', query)
      if (version) params.set('sgv', version)
      
      Object.entries(searchParams).forEach(([key, val]) => {
        if (key !== 'sort' && key !== 'page' && key !== 'v' && key !== 'sgv') {
          if (Array.isArray(val)) {
            val.forEach(v => params.append(key, v))
          } else if (val) {
            params.set(key, val)
          }
        }
      })
      
      if (value !== 'relevance') params.set('sort', value)
    } else {
      if (query) params.set('q', query)
      if (version) params.set('v', version)
      
      Object.entries(searchParams).forEach(([key, val]) => {
        if (key !== 'sort' && key !== 'page') {
          if (Array.isArray(val)) {
            val.forEach(v => params.append(key, v))
          } else if (val) {
            params.set(key, val)
          }
        }
      })
      
      if (value !== 'relevance') params.set('sort', value)
    }
    
    router.push(`/${categoryPath}?${params.toString()}`)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all group bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <svg className="w-4 h-4 text-gray-600 group-hover:text-modrinth-green dark:text-gray-400 transition-colors" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="m2.3037109 20.5410156c-.3964844.3847656-.40625 1.0175781-.0214844 1.4140625l3.8457031 3.9638672c.0002441.0002441.0006104.0003662.0008545.0006104.1817627.1881104.4343262.3070068.7169189.3070068s.5351562-.1188965.7169189-.3070068c.0002441-.0002441.0006104-.0003662.0008545-.0006104l3.8466797-3.9638672c.3847656-.3964844.375-1.0292969-.0214844-1.4140625s-1.0292969-.375-1.4140625.0214844l-2.1289062 2.1940308v-15.9830933c0-.5527344-.4472656-1-1-1s-1 .4472656-1 1v15.9827881l-2.1279296-2.1937256c-.3847656-.3964844-1.0175781-.40625-1.4140625-.0214844z"/>
          <path fill="currentColor" d="m26.8798828 12.9228516c0-.5527344-.4472656-1-1-1h-10.8515625c-.5527344 0-1 .4472656-1 1s.4472656 1 1 1h10.8515625c.5527344 0 1-.4472657 1-1z"/>
          <path fill="currentColor" d="m23.7597656 19.0732422c0-.5527344-.4472752-1-1-1h-7.7314453c-.5527344 0-1 .4472656-1 1s.4472656 1 1 1h7.7314453c.5527249 0 1-.4472656 1-1z"/>
          <path fill="currentColor" d="m15.0283203 24.2265625c-.5527344 0-1 .4472656-1 1s.4472656 1 1 1h4.6113281c.5527344 0 1-.4472656 1-1s-.4472656-1-1-1z"/>
          <path fill="currentColor" d="m29 5.7734375h-13.9716797c-.5527344 0-1 .4472656-1 1s.4472656 1 1 1h13.9716797c.5527344 0 1-.4472656 1-1s-.4472656-1-1-1z"/>
        </svg>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-300 dark:group-hover:text-white transition-colors">{currentOption.label}</span>
        <svg 
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl z-50 overflow-hidden dark:border-[#2e3035] dark:bg-[#27292e]">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                currentSort === option.value 
                  ? 'bg-modrinth-green/20 text-modrinth-green font-semibold' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#34363c]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
