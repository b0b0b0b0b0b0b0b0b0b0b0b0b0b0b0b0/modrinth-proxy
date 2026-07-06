'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { resolveModrinthProjectAccent } from '@/lib/modrinth'

export default function ContentNavigation({
  slug,
  contentType,
  versionsCount = 0,
  galleryCount = 0,
  projectColor,
}) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const accent = useMemo(
    () => resolveModrinthProjectAccent(projectColor),
    [projectColor],
  )
  const effectiveAccent = accent && (!mounted || resolvedTheme === 'dark') ? accent : null

  const isActive = (path) => {
    if (path === `/${contentType}/${slug}`) {
      return pathname === path
    }
    if (path === `/${contentType}/${slug}/versions`) {
      return pathname.startsWith(path) || pathname.includes(`/${contentType}/${slug}/version/`)
    }
    return pathname.startsWith(path)
  }

  const tabs = [
    { href: `/${contentType}/${slug}`, label: 'Описание' },
    galleryCount > 0 && { href: `/${contentType}/${slug}/gallery`, label: `Галерея (${galleryCount})` },
    { href: `/${contentType}/${slug}/changelog`, label: 'Изменения' },
    { href: `/${contentType}/${slug}/versions`, label: `Версии${versionsCount > 0 ? ` (${versionsCount})` : ''}` },
  ].filter(Boolean)

  return (
    <div className="overflow-x-auto mb-4 mobile-nav-spacing">
      <nav
        className={`relative flex w-fit rounded-full p-1 text-sm font-bold ${effectiveAccent ? '' : 'bg-gray-800'}`}
        style={
          effectiveAccent
            ? { backgroundColor: effectiveAccent.trackBgCss }
            : undefined
        }
      >
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`button-animation z-[1] flex flex-row items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                active
                  ? effectiveAccent
                    ? ''
                    : 'bg-modrinth-green text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={
                active && effectiveAccent
                  ? {
                      backgroundColor: effectiveAccent.accentHex,
                      color: effectiveAccent.activeFgHex,
                    }
                  : undefined
              }
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
