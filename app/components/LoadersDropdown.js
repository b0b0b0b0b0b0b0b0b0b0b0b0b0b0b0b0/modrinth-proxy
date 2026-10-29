'use client'

import { useState, useRef, useEffect } from 'react'
import { resolveLoader } from '@/lib/loaders'
import { useT } from './I18nProvider'

function FilterCheckbox({ checked }) {
  return (
    <div
      className={`glass-check w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition ${
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

export function MultiSelectDropdown({ options, selected, onChange, placeholder, capitalize = false }) {
  const t = useT()
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

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  const getLabel = () => {
    if (selected.length === 0) return placeholder
    if (selected.length === 1) return options.find((o) => o.id === selected[0])?.name ?? selected[0]
    return t('filter.selected', { n: selected.length })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`glass-btn flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-gray-900 dark:text-white ${capitalize ? 'capitalize' : ''}`}
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
        <div className="absolute top-full left-0 mt-2 w-64 glass-pop z-50 overflow-hidden animate-fade-in rounded-xl">
          <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-1">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm transition text-left rounded-xl hover:bg-gray-100 dark:hover:bg-[#34363c]"
                  style={{ color: option.color || 'var(--text-primary)' }}
                >
                  <FilterCheckbox checked={selected.includes(option.id)} />
                  <span className="flex items-center gap-2 min-w-0">
                    {option.icon ? <div className="w-4 h-4 flex-shrink-0">{option.icon}</div> : null}
                    <span className="truncate">{option.name}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoadersDropdown({ loaders, selectedLoaders, onLoadersChange }) {
  const t = useT()
  const options = loaders.map((loaderId) => {
    const loaderData = resolveLoader(loaderId)
    return { id: loaderId, name: loaderData.name, icon: loaderData.icon, color: loaderData.color }
  })

  return (
    <MultiSelectDropdown
      options={options}
      selected={selectedLoaders}
      onChange={onLoadersChange}
      placeholder={t('filter.platform')}
      capitalize
    />
  )
}
