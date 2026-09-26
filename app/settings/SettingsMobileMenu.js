'use client'

import { useCallback, useEffect, useState } from 'react'
import { SETTINGS_SECTIONS } from './SettingsNav'
import { useT } from '../components/I18nProvider'

const SCROLL_OFFSET = 96

function navButtonClass(active) {
  return `w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
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

export default function SettingsMobileMenu() {
  const t = useT()
  const [isOpen, setIsOpen] = useState(false)
  const [activeId, setActiveId] = useState(SETTINGS_SECTIONS[0].id)

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev)
    window.addEventListener('toggleSettingsNav', handleToggle)
    return () => window.removeEventListener('toggleSettingsNav', handleToggle)
  }, [])

  const updateActive = useCallback(() => {
    setActiveId(resolveActiveSection())
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined
    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })
    return () => window.removeEventListener('scroll', updateActive)
  }, [isOpen, updateActive])

  const scrollTo = (id) => {
    setActiveId(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="absolute top-0 left-0 h-full w-80 max-w-[85vw] bg-modrinth-darker shadow-2xl overflow-y-auto p-4 transform transition-transform animate-slide-in-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{t('settings.nav.sections')}</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label={t('settings.nav.close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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
  )
}
