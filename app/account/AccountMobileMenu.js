'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useT } from '../components/I18nProvider'

export default function AccountMobileMenu({ items }) {
  const t = useT()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev)
    window.addEventListener('toggleAccountNav', handleToggle)
    return () => window.removeEventListener('toggleAccountNav', handleToggle)
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="absolute top-0 left-0 h-full w-80 max-w-[85vw] bg-modrinth-darker shadow-2xl overflow-y-auto p-4 transform transition-transform animate-slide-in-left"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{t('nav.sections')}</h2>
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
        <nav className="space-y-1" aria-label={t('nav.sections')}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/account?tab=${item.id}`}
              onClick={() => setIsOpen(false)}
              aria-current={item.active ? 'page' : undefined}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                item.active
                  ? 'bg-[rgba(var(--color-green-rgb),0.15)] font-semibold text-modrinth-green'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                <path d={item.icon} />
              </svg>
              <span className="flex-1">{item.label}</span>
              {item.count !== null ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${
                    item.active
                      ? 'bg-modrinth-green/20 text-modrinth-green'
                      : item.highlight
                        ? 'bg-modrinth-green text-black'
                        : 'bg-[var(--bg-tertiary)] text-gray-400'
                  }`}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
