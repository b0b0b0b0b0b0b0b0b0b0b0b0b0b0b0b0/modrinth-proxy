'use client'

import { useEffect, useState } from 'react'
import { useT } from './I18nProvider'

export const COOKIE_NOTICE_KEY = 'cookieNoticeOk'

export function cookieNoticeAccepted() {
  try {
    return localStorage.getItem(COOKIE_NOTICE_KEY) === '1'
  } catch {
    return true
  }
}

export default function CookieNotice() {
  const t = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (cookieNoticeAccepted()) return
    const timer = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  const accept = () => {
    setVisible(false)
    try {
      localStorage.setItem(COOKIE_NOTICE_KEY, '1')
    } catch {}
  }

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-24 z-50 flex justify-center animate-slide-up lg:bottom-5">
      <div
        role="status"
        className="pointer-events-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-gray-700 bg-modrinth-dark/95 py-2 pl-4 pr-2.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        <svg className="h-6 w-6 shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01" />
        </svg>
        <p className="min-w-0 text-sm leading-snug text-gray-200">{t('cookie.text')}</p>
        <button
          type="button"
          onClick={accept}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-modrinth-green px-2.5 py-1.5 text-xs font-bold leading-none text-black transition-opacity hover:opacity-90"
        >
          {t('cookie.ok')}
        </button>
      </div>
    </div>
  )
}
