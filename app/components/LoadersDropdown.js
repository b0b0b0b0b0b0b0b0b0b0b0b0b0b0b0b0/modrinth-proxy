'use client'

import { useState, useRef, useEffect } from 'react'
import { LOADERS } from '@/lib/loaders'

export default function LoadersDropdown({ loaders, selectedLoaders, onLoadersChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleLoader = (loader) => {
    const newLoaders = selectedLoaders.includes(loader)
      ? selectedLoaders.filter(l => l !== loader)
      : [...selectedLoaders, loader]
    onLoadersChange(newLoaders)
  }

  const getLabel = () => {
    if (selectedLoaders.length === 0) return 'Платформы'
    if (selectedLoaders.length === 1) {
      const loaderData = LOADERS.find(l => l.id === selectedLoaders[0])
      return loaderData ? loaderData.name : selectedLoaders[0]
    }
    return `${selectedLoaders.length} выбрано`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white text-sm border border-gray-700 hover:border-modrinth-green transition capitalize"
        style={{ borderRadius: '0.75rem' }}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 3H2l8 9.46V19l4 2v-8.54z" />
        </svg>
        <span>{getLabel()}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 shadow-2xl z-50 overflow-hidden animate-fade-in" style={{ borderRadius: '0.75rem' }}>
          <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-1">
              {loaders.filter(l => l !== 'minecraft').map(loaderId => {
                const loaderData = LOADERS.find(l => l.id === loaderId)
                if (!loaderData) return null
                
                return (
                  <button
                    key={loaderId}
                    onClick={() => toggleLoader(loaderId)}
                    className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-700 transition text-left"
                    style={{ borderRadius: '0.75rem', color: loaderData.color || 'var(--text-primary)' }}
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 flex-shrink-0">
                        {loaderData.icon}
                      </div>
                      {loaderData.name}
                    </span>
                    {selectedLoaders.includes(loaderId) && (
                      <svg className="w-5 h-5 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
