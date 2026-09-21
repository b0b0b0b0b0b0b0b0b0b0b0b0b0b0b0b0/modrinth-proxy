'use client'

import { useState, useEffect } from 'react'

export default function ThoughtFeedbackBubble() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('feedbackThoughtDismissed') === 'true') return

    const timer = setTimeout(() => {
      setVisible(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem('feedbackThoughtDismissed', 'true')
  }

  if (!visible) return null

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-[100] w-72 sm:w-80 max-w-[calc(100vw-2rem)] animate-thought-pop pointer-events-auto">
      <div className="relative animate-thought-float">
        <div className="relative overflow-hidden rounded-2xl border border-modrinth-green/40 bg-gray-950 p-4 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleDismiss}
            title="Закрыть"
            aria-label="Закрыть"
            className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-start gap-3 pr-4">
            <span className="text-xl leading-none select-none mt-0.5">💭</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white leading-snug mb-3 tracking-wide whitespace-normal break-words">
                У тебя есть предложение или нашёл баг?
              </p>
              <a
                href="https://github.com/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDismiss}
                className="inline-flex items-center gap-2 rounded-xl bg-modrinth-green px-3.5 py-1.5 text-xs font-bold text-black shadow-md transition-all duration-200 hover:bg-modrinth-green-light hover:scale-95 active:scale-90"
              >
                <span>Напиши нам</span>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="absolute -top-1.5 right-8 h-3 w-3 rotate-45 border-t border-l border-modrinth-green/40 bg-gray-950 z-10" />
      </div>
    </div>
  )
}
