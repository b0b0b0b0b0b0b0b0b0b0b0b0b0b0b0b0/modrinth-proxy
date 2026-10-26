'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useI18n } from './I18nProvider'
import { cookieNoticeAccepted } from './CookieNotice'
import { BrowserLogo, browserLabel } from './BrowserIcons'
import { EXTENSION_STORES, detectClientBrowser } from '@/lib/browserDetect'

export default function ExtensionBanner() {
  const { t, locale } = useI18n()
  const pathname = usePathname()
  const [browser, setBrowser] = useState(null)

  useEffect(() => {
    if (pathname?.startsWith('/extension')) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem('extensionBannerDismissed') === 'true') return
    if (!cookieNoticeAccepted()) return
    const detected = detectClientBrowser()
    if (!detected.family) return
    const t = setTimeout(() => setBrowser(detected), 1000)
    return () => clearTimeout(t)
  }, [pathname])

  const handleDismiss = () => {
    setBrowser(null)
    localStorage.setItem('extensionBannerDismissed', 'true')
  }

  if (!browser || pathname?.startsWith('/extension')) return null

  const label = browserLabel(browser.name, locale, browser.product)
  const store = EXTENSION_STORES[browser.family]

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md animate-slide-up">
      <div className="relative overflow-hidden rounded-2xl border border-modrinth-green/30 bg-gradient-to-br from-modrinth-green/20 via-modrinth-green-light/10 to-modrinth-green-light/20 p-4 shadow-2xl backdrop-blur-xl sm:p-5 group">
        <div className="absolute inset-0 bg-gradient-to-br from-modrinth-green/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t('ext.banner.close')}
          className="group/close absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-700/50 bg-gray-800/50 transition-all duration-300 hover:border-modrinth-green/50 hover:bg-gray-700/70 sm:right-3 sm:top-3 sm:h-8 sm:w-8"
        >
          <svg className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover/close:text-white sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative flex gap-3 pr-6 sm:gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 sm:h-12 sm:w-12">
            <BrowserLogo name={browser.name} className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-base font-bold text-white sm:text-lg">
              {t('ext.banner.title', { browser: label })}
            </h3>
            <p className="text-xs leading-relaxed text-gray-300 sm:text-sm">{t('ext.banner.hint')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={store}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-modrinth-green px-3 py-2 text-sm font-bold text-black shadow-lg transition-all duration-300 hover:scale-95 hover:bg-modrinth-green-light"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v12m0 0-4.5-4.5M12 16l4.5-4.5M5 20h14" />
                </svg>
                {t('ext.banner.install')}
              </a>
              <Link
                href="/extension"
                className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {t('ext.banner.more')}
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-modrinth-green via-modrinth-green-light to-modrinth-green opacity-50" />
      </div>
    </div>
  )
}
