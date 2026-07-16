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
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium border transition rounded-xl bg-gray-100 text-gray-900 border-gray-200 hover:border-modrinth-green dark:bg-gray-800 dark:text-white dark:border-gray-700"
      >
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 3H2l8 9.46V19l4 2v-8.54z" />
        </svg>
        <span>{selectedVersion === 'all' ? 'Версии игры' : selectedVersion}</span>
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 border shadow-2xl z-50 overflow-hidden animate-fade-in rounded-xl border-gray-200 bg-white dark:border-[#2e3035] dark:bg-[#27292e]">
          <div className="p-2">
            <div className="relative mb-2">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border focus:border-modrinth-green focus:outline-none rounded-xl bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-white dark:border-gray-700"
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
                    className="flex items-center justify-between px-3 py-2 text-sm transition text-left rounded-xl text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#34363c]"
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

            <div className="border-t mt-2 pt-2 border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onShowOnlyReleasesChange(!showOnlyReleases)}
                className="flex items-center gap-2 px-3 py-2 text-sm transition w-full rounded-xl text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#34363c]"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                  showOnlyReleases ? 'bg-modrinth-green border-modrinth-green' : 'border-gray-400 dark:border-gray-600'
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
