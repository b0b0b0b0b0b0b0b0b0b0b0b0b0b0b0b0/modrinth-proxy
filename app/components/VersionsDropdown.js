'use client'

import { useState, useRef, useEffect } from 'react'

export default function VersionsDropdown({
  versions,
  selectedVersion,
  onVersionChange,
  showOnlyReleases,
  onShowOnlyReleasesChange
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredVersions = versions.filter(v => 
    v.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white text-sm border border-gray-700 hover:border-modrinth-green transition"
        style={{ borderRadius: '0.75rem' }}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 3H2l8 9.46V19l4 2v-8.54z" />
        </svg>
        <span>{selectedVersion === 'all' ? 'Версии игры' : selectedVersion}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 shadow-2xl z-50 overflow-hidden animate-fade-in" style={{ borderRadius: '0.75rem' }}>
          <div className="p-2">
            <div className="relative mb-2">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-900 text-white text-sm border border-gray-700 focus:border-modrinth-green focus:outline-none"
                style={{ borderRadius: '0.75rem' }}
              />
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-1">
                {filteredVersions.map(v => (
                  <button
                    key={v}
                    onClick={() => {
                      onVersionChange(selectedVersion === v ? 'all' : v)
                      setIsOpen(false)
                      setSearchQuery('')
                    }}
                    className="flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-gray-700 transition text-left"
                    style={{ borderRadius: '0.75rem' }}
                  >
                    <span>{v}</span>
                    {selectedVersion === v && (
                      <svg className="w-5 h-5 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-700 mt-2 pt-2">
              <button
                onClick={() => onShowOnlyReleasesChange(!showOnlyReleases)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-gray-700 transition w-full"
                style={{ borderRadius: '0.75rem' }}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                  showOnlyReleases ? 'bg-modrinth-green border-modrinth-green' : 'border-gray-600'
                }`}>
                  {showOnlyReleases && (
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>Показать только релизы</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
