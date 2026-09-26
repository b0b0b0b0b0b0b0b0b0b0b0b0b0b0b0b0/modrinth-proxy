'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useT } from './I18nProvider'

export default function ExtensionBanner() {
  const t = useT()
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (pathname?.startsWith('/extension')) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem('extensionBannerDismissed') === 'true') return
    const t = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(t)
  }, [pathname])

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem('extensionBannerDismissed', 'true')
  }

  if (!visible || pathname?.startsWith('/extension')) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md animate-slide-up">
      <div className="relative overflow-hidden rounded-2xl border border-modrinth-green/30 bg-gradient-to-br from-modrinth-green/20 via-modrinth-green-light/10 to-modrinth-green-light/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6 group">
        <div className="absolute inset-0 bg-gradient-to-br from-modrinth-green/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <button
          type="button"
          onClick={handleDismiss}
          className="group/close absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-700/50 bg-gray-800/50 transition-all duration-300 hover:border-modrinth-green/50 hover:bg-gray-700/70 sm:right-3 sm:top-3 sm:h-8 sm:w-8"
        >
          <svg className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover/close:text-white sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative">
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 flex flex-wrap items-center gap-2 text-base font-bold text-white sm:text-lg">
              {t('ext.bannerTitle')}
            </h3>
            <p className="mb-3 text-xs leading-relaxed text-gray-300 sm:mb-4 sm:text-sm">
              {t('ext.bannerHint')}
            </p>

            <div className="sm:hidden">
              <span className="text-xs italic text-gray-400">{t('ext.pcOnly')}</span>
            </div>

            <div className="mt-3 hidden justify-center sm:flex">
              <Link
                href="/extension"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-modrinth-green px-3 py-2 text-sm font-bold text-black shadow-lg transition-all duration-300 hover:scale-95 hover:bg-modrinth-green-light hover:shadow-modrinth-green/50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {t('ext.whatBtn')}
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-modrinth-green via-modrinth-green-light to-modrinth-green opacity-50" />
      </div>
    </div>
  )
}
