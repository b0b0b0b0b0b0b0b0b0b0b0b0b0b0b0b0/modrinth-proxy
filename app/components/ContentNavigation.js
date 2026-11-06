'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { resolveModrinthProjectAccent } from '@/lib/modrinth'
import { useT } from './I18nProvider'

export default function ContentNavigation({
  slug,
  contentType,
  versionsCount = 0,
  galleryCount = 0,
  projectColor,
}) {
  const t = useT()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const [pending, setPending] = useState(null)
  const accent = useMemo(
    () => resolveModrinthProjectAccent(projectColor),
    [projectColor],
  )

  const matches = (path) => {
    if (path === `/${contentType}/${slug}`) {
      return pathname === path
    }
    if (path === `/${contentType}/${slug}/versions`) {
      return pathname.startsWith(path) || pathname.includes(`/${contentType}/${slug}/version/`)
    }
    return pathname.startsWith(path)
  }

  const tabs = [
    { href: `/${contentType}/${slug}`, label: t('project.description') },
    galleryCount > 0 && { href: `/${contentType}/${slug}/gallery`, label: t('project.gallery', { n: galleryCount }) },
    { href: `/${contentType}/${slug}/changelog`, label: t('project.changelog') },
    { href: `/${contentType}/${slug}/versions`, label: versionsCount > 0 ? t('project.versionsN', { n: versionsCount }) : t('project.versions') },
  ].filter(Boolean)

  const pendingHref = pending && pending.from === pathname ? pending.href : null
  const isActive = (href) => (pendingHref ? pendingHref === href : matches(href))

  const handleClick = (event, href) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    setPending({ href, from: pathname })
  }

  return (
    <div className="overflow-x-auto mb-4 mobile-nav-spacing">
      <nav
        className={`glass-track relative flex w-fit rounded-full p-1 text-sm font-bold bg-gray-800 ${
          accent ? 'dark:bg-(--nav-track)' : ''
        }`}
        style={
          accent
            ? {
                '--nav-track': accent.trackBgCss,
                '--nav-accent': accent.accentHex,
                '--nav-accent-fg': accent.activeFgHex,
              }
            : undefined
        }
      >
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={(event) => handleClick(event, tab.href)}
              aria-current={active ? 'page' : undefined}
              className={`button-animation relative z-1 flex flex-row items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                active
                  ? `text-black ${accent ? 'dark:text-(--nav-accent-fg)' : ''}`
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {active ? (
                <motion.span
                  layoutId={`content-nav-${contentType}-${slug}`}
                  className={`glass-pill absolute inset-0 z-[-1] rounded-full bg-modrinth-green ${
                    accent ? 'dark:bg-(--nav-accent)' : ''
                  }`}
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                />
              ) : null}
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
