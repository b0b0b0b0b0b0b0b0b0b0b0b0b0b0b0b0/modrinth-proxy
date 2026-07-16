'use client'

import { useState, useRef, useEffect } from 'react'
import { LOADERS } from '@/lib/loaders'

function FilterCheckbox({ checked }) {
  return (
    <div
      className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition ${
        checked
          ? 'bg-modrinth-green border-modrinth-green'
          : 'border-gray-400 dark:border-gray-600'
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  )
}

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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition capitalize rounded-xl bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
      >
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 3H2l8 9.46V19l4 2v-8.54z" />
        </svg>
        <span>{getLabel()}</span>
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 border shadow-2xl z-50 overflow-hidden animate-fade-in rounded-xl border-gray-200 bg-white dark:border-[#2e3035] dark:bg-[#27292e]">
          <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-1">
              {loaders.map(loaderId => {
                const loaderData = LOADERS.find(l => l.id === loaderId)
                if (!loaderData) return null
                const checked = selectedLoaders.includes(loaderId)

                return (
                  <button
                    key={loaderId}
                    type="button"
                    onClick={() => toggleLoader(loaderId)}
                    className="flex items-center gap-2 px-3 py-2 text-sm transition text-left rounded-xl hover:bg-gray-100 dark:hover:bg-[#34363c]"
                    style={{ color: loaderData.color || 'var(--text-primary)' }}
                  >
                    <FilterCheckbox checked={checked} />
                    <span className="flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 flex-shrink-0">
                        {loaderData.icon}
                      </div>
                      <span className="truncate">{loaderData.name}</span>
                    </span>
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
