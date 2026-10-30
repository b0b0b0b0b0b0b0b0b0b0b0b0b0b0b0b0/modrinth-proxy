'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'catalog-filter-sections'
const STYLE_ID = 'filter-section-collapsed'
const EVENT = 'catalog-filter-sections'

function safeId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '')
}

export function readCollapsedFilters() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.map(safeId).filter(Boolean))]
  } catch {
    return []
  }
}

export function collapsedFilterCss(ids) {
  return ids.map((id) => {
    const safe = safeId(id)
    if (!safe) return ''
    return `[data-filter-section="${safe}"]>.filter-section-body{display:none}[data-filter-section="${safe}"] .filter-section-chevron{transform:none}`
  }).join('')
}

function writeCollapsedFilters(ids) {
  const list = [...new Set(ids.map(safeId).filter(Boolean))]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  let style = document.getElementById(STYLE_ID)
  const css = collapsedFilterCss(list)
  if (!css) {
    style?.remove()
  } else {
    if (!style) {
      style = document.createElement('style')
      style.id = STYLE_ID
      document.head.appendChild(style)
    }
    style.textContent = css
  }
  window.dispatchEvent(new CustomEvent(EVENT))
}

export function useCatalogFilterOpen(id) {
  const safe = safeId(id)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const sync = () => setOpen(!readCollapsedFilters().includes(safe))
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [safe])

  const toggle = () => {
    const current = readCollapsedFilters()
    const willOpen = current.includes(safe)
    writeCollapsedFilters(willOpen ? current.filter((item) => item !== safe) : [...current, safe])
    setOpen(willOpen)
  }

  return [open, toggle]
}

export function FilterChevron({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`filter-section-chevron h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
    </svg>
  )
}

export default function CatalogFilterSection({ id, title, children }) {
  const [open, toggle] = useCatalogFilterOpen(id)

  return (
    <div data-filter-section={safeId(id)} className="overflow-hidden rounded-xl card-glass bg-modrinth-dark">
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <h3 className="m-0 flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-gray-300">
          {title}
        </h3>
        <FilterChevron open={open} />
      </button>
      {open && <div className="filter-section-body px-4 pb-4">{children}</div>}
    </div>
  )
}
