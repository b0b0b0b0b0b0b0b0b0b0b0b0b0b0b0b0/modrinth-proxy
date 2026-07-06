'use client'

import { useState, useEffect } from 'react'
import PluginSidebarFilters from './PluginSidebarFilters'

export default function MobileMenu({ initialVersions = null }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev)
    window.addEventListener('toggleMobileFilter', handleToggle)
    return () => window.removeEventListener('toggleMobileFilter', handleToggle)
  }, [])

  if (!isOpen) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)}>
      <div 
        className="absolute top-0 left-0 h-full w-80 bg-modrinth-darker shadow-2xl overflow-y-auto p-4 transform transition-transform animate-slide-in-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Фильтры</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <PluginSidebarFilters isMobile initialVersions={initialVersions} />
      </div>
    </div>
  )
}
