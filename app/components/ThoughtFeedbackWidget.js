'use client'

import { useState, useEffect } from 'react'

export default function ThoughtFeedbackWidget() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('feedbackThoughtDismissed') === 'true') return
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem('feedbackThoughtDismissed', 'true')
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-4 z-40 sm:bottom-6 sm:left-6 max-w-[calc(100vw-2rem)] sm:max-w-sm animate-thought-pop pointer-events-auto">
      <div className="animate-thought-float relative">
        {/* Glow behind the thought bubble */}
        <div className="absolute -inset-2 bg-gradient-to-r from-modrinth-green/30 via-modrinth-green-light/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-75 animate-pulse pointer-events-none" />

        {/* Main Thought Cloud Container */}
        <div className="relative overflow-hidden rounded-[2.2rem] border border-modrinth-green/40 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-black/95 p-4 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl group">
          {/* Subtle background shine */}
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-modrinth-green/10 blur-2xl group-hover:bg-modrinth-green/20 transition-all duration-500" />
          <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-modrinth-green-light/10 blur-2xl" />

          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            title="Закрыть подсказаку"
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-700/60 bg-gray-800/80 text-gray-400 transition-all duration-200 hover:border-modrinth-green/60 hover:bg-gray-700 hover:text-white sm:h-8 sm:w-8"
            aria-label="Закрыть"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header Badge */}
          <div className="mb-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-modrinth-green/40 bg-modrinth-green/15 px-3 py-1 text-xs font-bold text-modrinth-green shadow-sm backdrop-blur-md">
              <span className="text-sm">💭</span>
              <span>Есть мысль?</span>
            </span>
          </div>

          {/* Content */}
          <div className="relative pr-4">
            <h3 className="mb-1 text-sm sm:text-base font-bold text-white tracking-wide leading-snug">
              Есть предложения или нашли баг?
            </h3>
            <p className="mb-3.5 text-xs sm:text-sm leading-relaxed text-gray-300">
              Нас уже больше <span className="font-semibold text-modrinth-green">10 000 человек в день</span>! Напишите нам в GitHub Issues — мы читаем все предложения и оперативно чиним ошибки.
            </p>

            {/* Action Link */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-modrinth-green via-modrinth-green-hover-light to-modrinth-green-light px-4 py-2.5 text-xs sm:text-sm font-bold text-black shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-modrinth-green/30 active:scale-95"
              >
                <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Написать в Issues</span>
                <svg className="h-3.5 w-3.5 shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Thought Bubble Tail (Comic-style thought circles) */}
        <div className="absolute -bottom-3 left-8 flex flex-col items-center gap-1">
          <div className="h-3.5 w-3.5 rounded-full border border-modrinth-green/40 bg-gray-900/90 shadow-md backdrop-blur-md" />
          <div className="ml-1 h-2 w-2 rounded-full border border-modrinth-green/30 bg-gray-900/80 shadow-sm" />
        </div>
      </div>
    </div>
  )
}
