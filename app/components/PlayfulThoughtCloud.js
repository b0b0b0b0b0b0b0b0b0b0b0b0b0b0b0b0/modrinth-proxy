'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function PlayfulThoughtCloud() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState(null)
  const bubbleRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('thoughtCloudClosed') === 'true') return

    setVisible(false)
    setCoords(null)

    const timer = setTimeout(() => {
      const target =
        document.querySelector('[data-thought-target]') ||
        document.querySelector('.resource-card') ||
        document.querySelector('main h1') ||
        document.querySelector('main')

      if (target) {
        const rect = target.getBoundingClientRect()
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft

        setCoords({
          top: rect.top + scrollTop - 75,
          left: Math.max(16, Math.min(rect.left + scrollLeft + 16, window.innerWidth - 280)),
        })
      }
      setVisible(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [pathname])

  const handleDismiss = () => {
    setVisible(false)
    sessionStorage.setItem('thoughtCloudClosed', 'true')
  }

  if (!visible) return null

  const style = coords
    ? { position: 'absolute', top: `${coords.top}px`, left: `${coords.left}px` }
    : { position: 'fixed', top: '80px', right: '24px' }

  return (
    <div
      ref={bubbleRef}
      style={style}
      className="z-50 w-64 max-w-[calc(100vw-2rem)] animate-thought-pop pointer-events-auto"
    >
      <div className="relative">
        <div className="relative rounded-xl border border-gray-700/60 bg-[#1a1d24] p-3 shadow-xl text-white">
          <button
            type="button"
            onClick={handleDismiss}
            title="Закрыть"
            aria-label="Закрыть"
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <p className="mb-2 text-xs font-semibold leading-relaxed text-gray-200 pr-4">
            У тебя есть предложение или нашёл баг?
          </p>

          <div className="flex items-center">
            <a
              href="https://github.com/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDismiss}
              className="inline-flex items-center gap-1.5 rounded-lg bg-modrinth-green px-3 py-1.5 text-xs font-bold text-black shadow transition-all duration-200 hover:bg-modrinth-green-light active:scale-95"
            >
              <span>Напиши нам</span>
            </a>
          </div>
        </div>

        <div className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-b border-r border-gray-700/60 bg-[#1a1d24]" />
      </div>
    </div>
  )
}
