'use client'

import { useState, useEffect } from 'react'

export default function ThoughtFeedbackTooltip({
  delayMs = 2500,
  position = 'bottom',
  align = 'center',
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('feedbackThoughtDismissed') === 'true') return

    const timer = setTimeout(() => {
      setVisible(true)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [delayMs])

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem('feedbackThoughtDismissed', 'true')
  }

  if (!visible) return null

  const positionClasses =
    position === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-2'

  const alignClasses =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2'

  const tailPositionClasses =
    position === 'top'
      ? '-bottom-1.5 border-b border-r'
      : '-top-1.5 border-t border-l'

  const tailAlignClasses =
    align === 'left'
      ? 'left-4'
      : align === 'right'
      ? 'right-4'
      : 'left-1/2 -translate-x-1/2'

  return (
    <div
      className={`absolute ${positionClasses} ${alignClasses} z-50 w-64 max-w-[calc(100vw-2rem)] animate-thought-pop pointer-events-auto`}
    >
      <div className="relative animate-thought-float">
        <div className="relative rounded-2xl border border-modrinth-green/40 bg-gray-950 p-3 shadow-xl">
          <button
            type="button"
            onClick={handleDismiss}
            title="Закрыть"
            aria-label="Закрыть"
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-start gap-2.5 pr-4">
            <span className="text-base sm:text-lg leading-none select-none mt-0.5">💭</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-tight mb-2 tracking-wide">
                У тебя есть предложение или нашёл баг?
              </p>
              <a
                href="https://github.com/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDismiss}
                className="inline-flex items-center gap-1.5 rounded-lg bg-modrinth-green px-3 py-1.5 text-[11px] font-bold text-black shadow transition-all duration-200 hover:bg-modrinth-green-light hover:scale-95 active:scale-90"
              >
                <span>Напиши нам</span>
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div
          className={`absolute ${tailPositionClasses} ${tailAlignClasses} h-3 w-3 rotate-45 border-modrinth-green/40 bg-gray-950 z-10`}
        />
      </div>
    </div>
  )
}
