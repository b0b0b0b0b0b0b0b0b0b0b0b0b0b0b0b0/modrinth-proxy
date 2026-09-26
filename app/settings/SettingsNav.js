'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useT } from '../components/I18nProvider'

export const SETTINGS_SECTIONS = [
  { id: 'settings-language', labelKey: 'settings.nav.language' },
  { id: 'settings-color-theme', labelKey: 'settings.nav.theme' },
  { id: 'settings-color-palette', labelKey: 'settings.nav.palette' },
  { id: 'settings-features', labelKey: 'settings.nav.features' },
  { id: 'settings-project-layouts', labelKey: 'settings.nav.layouts' },
]

const SCROLL_OFFSET = 96

function navButtonClass(active) {
  return `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
    active
      ? 'bg-[rgba(var(--color-green-rgb),0.15)] text-modrinth-green font-semibold'
      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
  }`
}

function resolveActiveSection() {
  let active = SETTINGS_SECTIONS[0].id

  for (const section of SETTINGS_SECTIONS) {
    const element = document.getElementById(section.id)
    if (element && element.getBoundingClientRect().top <= SCROLL_OFFSET) {
      active = section.id
    }
  }

  return active
}

export default function SettingsNav() {
  const t = useT()
  const [activeId, setActiveId] = useState(SETTINGS_SECTIONS[0].id)
  const scrollLockRef = useRef(null)
  const scrollUnlockTimerRef = useRef(null)

  const updateActive = useCallback(() => {
    if (scrollLockRef.current) return
    setActiveId(resolveActiveSection())
  }, [])

  useEffect(() => {
    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })
    window.addEventListener('resize', updateActive)

    return () => {
      window.removeEventListener('scroll', updateActive)
      window.removeEventListener('resize', updateActive)
      if (scrollUnlockTimerRef.current) {
        window.clearTimeout(scrollUnlockTimerRef.current)
      }
    }
  }, [updateActive])

  const scrollTo = (id) => {
    scrollLockRef.current = id
    setActiveId(id)

    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    if (scrollUnlockTimerRef.current) {
      window.clearTimeout(scrollUnlockTimerRef.current)
    }

    scrollUnlockTimerRef.current = window.setTimeout(() => {
      scrollLockRef.current = null
      setActiveId(resolveActiveSection())
    }, 800)
  }

  return (
    <div className="hidden lg:block w-80 flex-shrink-0">
      <div className="lg:sticky lg:top-4 lg:self-start">
        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">{t('settings.nav.sections')}</h2>
          <nav className="space-y-1" aria-label={t('settings.nav.aria')}>
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollTo(section.id)}
                className={navButtonClass(activeId === section.id)}
                aria-current={activeId === section.id ? 'true' : undefined}
              >
                {t(section.labelKey)}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
