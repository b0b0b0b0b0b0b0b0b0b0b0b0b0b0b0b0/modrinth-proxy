'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function SearchInput({ 
  defaultValue = '',
  placeholder = 'Поиск...',
  categoryPath = 'mods',
  delay = 500,
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(defaultValue)
  const debounceTimerRef = useRef(null)
  const isUpdatingUrlRef = useRef(false)

  useEffect(() => {
    if (isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = false
      return
    }
    
    const urlQuery = searchParams.get('q') || ''
    setQuery(prevQuery => {
      if (prevQuery !== urlQuery) {
        return urlQuery
      }
      return prevQuery
    })
  }, [searchParams])

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const urlQuery = searchParams.get('q') || ''
    if (query !== urlQuery) {
      debounceTimerRef.current = setTimeout(() => {
        isUpdatingUrlRef.current = true
        const params = new URLSearchParams()
        
        if (query.trim()) {
          params.set('q', query.trim())
        }
        
        const v = searchParams.get('v')
        if (v) params.set('v', v)
        
        const gParams = searchParams.getAll('g')
        gParams.forEach(g => params.append('g', g))
        
        const fParams = searchParams.getAll('f')
        fParams.forEach(f => params.append('f', f))
        
        const env = searchParams.get('e')
        if (env) params.set('e', env)
        
        const sort = searchParams.get('sort')
        if (sort) params.set('sort', sort)
        
        router.push(`/${categoryPath}?${params.toString()}`)
      }, delay)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, router, categoryPath, searchParams, delay])

  const handleChange = (e) => {
    setQuery(e.target.value)
  }

  const updateUrl = () => {
    isUpdatingUrlRef.current = true
    const params = new URLSearchParams()
    
    if (query.trim()) {
      params.set('q', query.trim())
    }
    
    const v = searchParams.get('v')
    if (v) params.set('v', v)
    
    const gParams = searchParams.getAll('g')
    gParams.forEach(g => params.append('g', g))
    
    const fParams = searchParams.getAll('f')
    fParams.forEach(f => params.append('f', f))
    
    const env = searchParams.get('e')
    if (env) params.set('e', env)
    
    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    
    router.push(`/${categoryPath}?${params.toString()}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    updateUrl()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full md:flex-1 md:max-w-md">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-modrinth-green transition-colors"
        />
      </div>
    </form>
  )
}
