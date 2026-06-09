'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { getProjectTypeDisplayName } from '@/lib/author'

export default function AuthorProjectTabs({ currentType, typeStats, totalProjects }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createUrl = (type) => {
    const params = new URLSearchParams(searchParams)
    if (type) {
      params.set('type', type)
    } else {
      params.delete('type')
    }
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const tabs = useMemo(() => {
    const items = [
      {
        key: null,
        label: 'Все',
        isActive: !currentType,
      },
    ]

    Object.entries(typeStats).forEach(([type, count]) => {
      if (count > 0) {
        items.push({
          key: type,
          label: getProjectTypeDisplayName(type),
          isActive: currentType === type,
        })
      }
    })

    return items
  }, [currentType, typeStats])

  if (totalProjects === 0) return null

  return (
    <div className="mb-6 max-w-full overflow-x-auto overscroll-x-contain mobile-nav-spacing custom-scrollbar">
      <nav className="relative flex w-max rounded-full border border-gray-800 bg-modrinth-dark p-1 text-sm font-bold shadow-lg">
        {tabs.map((tab) => (
          <Link
            key={tab.key || 'all'}
            href={createUrl(tab.key)}
            className={`relative z-[1] flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-2 transition-colors ${
              tab.isActive
                ? 'bg-modrinth-green text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
