'use client'

import { MINEPLUGINCHECK_BOT_URL } from '@/lib/minePluginCheckBotUrl'
import { useT } from './I18nProvider'

export function DownloadPromoConnector({ className = '' }) {
  return (
    <div className={`flex flex-col items-center text-modrinth-green ${className}`} aria-hidden>
      <div className="h-7 w-[2px] rounded-full bg-gradient-to-b from-modrinth-green via-modrinth-green/70 to-transparent" />
      <svg
        className="-mt-1 h-3 w-3 shrink-0 text-modrinth-green"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}

export default function MinePluginCheckPromo({ contentType = 'mod' }) {
  const t = useT()
  const isPlugin = contentType === 'plugin'
  const kind = t(isPlugin ? 'ui.kindPlugin' : 'ui.kindMod')

  const lead = (
    <>
      <span className="text-gray-900 dark:text-gray-100">{t('ui.downloadedWait')}</span>{' '}
      <span className="text-gray-800 dark:text-gray-200">{t('ui.alwaysScan', { kind })}</span>
    </>
  )

  const ariaLabel = t(isPlugin ? 'ui.botPluginTip' : 'ui.botModTip')

  return (
    <div className="flex w-full max-w-none flex-col gap-3 rounded-2xl bg-modrinth-dark card-glass p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        {isPlugin ? (
          <>
            <p className="text-sm font-bold leading-snug sm:text-[15px]">{lead}</p>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-[13px]">
              {t('ui.scanPlugin')}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold leading-snug sm:text-[15px]">{lead}</p>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-[13px]">{t('ui.scanMod')}</p>
          </>
        )}
      </div>

      <a
        href={MINEPLUGINCHECK_BOT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className="glass-btn inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-modrinth-green no-underline sm:py-2 sm:pr-4"
      >
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-black/20" aria-hidden>
          <img src="/images/bot_logo.jpg" alt="" width={32} height={32} className="h-full w-full object-cover" />
        </span>
        <span className="leading-tight">{t('ui.goTelegram')}</span>
        <svg
          className="h-4 w-4 shrink-0 text-modrinth-green rtl:rotate-180"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12l4-4-4-4" />
        </svg>
      </a>
    </div>
  )
}
