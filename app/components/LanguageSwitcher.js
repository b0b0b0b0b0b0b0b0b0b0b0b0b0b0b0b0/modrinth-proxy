'use client'

import * as Popover from '@radix-ui/react-popover'
import { enabledLocales, getLocaleMeta } from '@/lib/i18n/config'
import { useI18n } from './I18nProvider'

export default function LanguageSwitcher({ compact = false }) {
  const { locale, setLocale, t } = useI18n()
  const current = getLocaleMeta(locale)

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={
            compact
              ? 'top-nav-link top-nav-link--icon inline-flex items-center justify-center gap-1 rounded-xl p-2 text-xs font-bold tracking-wide transition-colors'
              : 'inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-modrinth-dark px-3 py-2 text-sm font-semibold text-gray-200 transition hover:border-modrinth-green/40 hover:text-white'
          }
          aria-label={t('lang.switcher')}
          data-tooltip={t('lang.switcher')}
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          {!compact ? <span>{current.nativeName}</span> : <span>{current.short}</span>}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="end"
          className="z-[80] w-64 overflow-hidden rounded-2xl border border-gray-800 bg-modrinth-darker p-2 shadow-2xl shadow-black/40"
        >
          <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            {t('lang.label')}
          </p>
          <div className="flex flex-col gap-1">
            {enabledLocales().map((item) => {
              const active = item.id === locale
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLocale(item.id)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active
                      ? 'bg-[rgba(var(--color-green-rgb),0.16)] text-modrinth-green'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="flex flex-col">
                    <span>{item.nativeName}</span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{item.short}</span>
                  </span>
                  {active ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : null}
                </button>
              )
            })}
          </div>
          <p className="px-2 pb-1 pt-2 text-[11px] leading-snug text-gray-500">{t('lang.hint')}</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
