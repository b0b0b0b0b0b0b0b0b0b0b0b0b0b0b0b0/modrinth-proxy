'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { getProjectTypeDisplayName } from '@/lib/author'

export default function AuthorProjectTabs({
  profileBasePath,
  currentType,
  typeStats,
  totalProjects,
  collectionCount = 0,
  section = 'projects',
}) {
  const tabs = useMemo(() => {
    const items = []

    if (totalProjects > 0) {
      items.push({
        key: 'all',
        href: profileBasePath,
        label: 'Все',
        isActive: section === 'projects' && !currentType,
      })
    }

    Object.entries(typeStats || {}).forEach(([type, count]) => {
      if (count > 0) {
        items.push({
          key: type,
          href: `${profileBasePath}?type=${encodeURIComponent(type)}`,
          label: getProjectTypeDisplayName(type),
          isActive: section === 'projects' && currentType === type,
        })
      }
    })

    if (collectionCount > 0 || section === 'collections') {
      items.push({
        key: 'collections',
        href: `${profileBasePath}/collections`,
        label: 'Коллекции',
        isActive: section === 'collections',
      })
    }

    return items
  }, [collectionCount, currentType, profileBasePath, section, totalProjects, typeStats])

  if (totalProjects === 0 && collectionCount === 0) return null

  return (
    <div className="mb-6 max-w-full overflow-x-auto overscroll-x-contain mobile-nav-spacing custom-scrollbar">
      <nav className="relative flex w-max rounded-full border border-gray-800 bg-modrinth-dark p-1 text-sm font-bold shadow-lg">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
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
