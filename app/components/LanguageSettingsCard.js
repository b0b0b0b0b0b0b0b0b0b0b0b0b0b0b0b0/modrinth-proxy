'use client'

import { LOCALES } from '@/lib/i18n/config'
import { useI18n } from './I18nProvider'

function Flag({ code }) {
  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt=""
      aria-hidden="true"
      className="h-4 w-6 shrink-0 rounded-sm object-cover"
      loading="lazy"
    />
  )
}

export default function LanguageSettingsCard() {
  const { locale, setLocale, t } = useI18n()

  return (
    <section id="settings-language" className="universal-card settings-section" aria-labelledby="language-heading">
      <h2 id="language-heading" className="m-0 text-xl font-semibold text-white">
        {t('settings.languageTitle')}
      </h2>

      <div className="relative mt-2 mb-4 grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-x-2 rounded-2xl border border-solid border-orange-500/45 bg-orange-500/[0.12] p-4 text-gray-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className="h-6 w-6 flex-none text-orange-400"
          aria-hidden
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0M12 9v4M12 17h.01" />
        </svg>
        <p className="m-0 min-w-0 text-sm font-normal leading-tight text-gray-200/90">
          {t('settings.languageWarn')}
        </p>
      </div>

      <div role="radiogroup" aria-label={t('settings.languageStandard')} className="flex flex-col gap-1">
        <strong className="pt-2 pb-1 font-semibold text-white">{t('settings.languageStandard')}</strong>
        {LOCALES.map((item) => {
          const selected = locale === item.id
          const disabled = !item.enabled
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              aria-label={`${item.nativeName}. ${item.englishName}`}
              onClick={() => {
                if (!disabled) setLocale(item.id)
              }}
              className={`relative inline-flex h-10 w-full min-w-0 items-center justify-between gap-4 whitespace-normal rounded-[14px] border border-solid px-2 text-left text-base font-semibold leading-5 transition-colors ${
                selected
                  ? 'border-modrinth-green bg-[rgba(var(--color-green-rgb),0.16)] text-white'
                  : 'border-transparent bg-transparent text-white hover:bg-gray-800/80'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-[0.97]'}`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <Flag code={item.flag} />
                <span className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden">
                  <span className="truncate text-sm sm:text-base">{item.nativeName}</span>
                  {item.englishName !== item.nativeName ? (
                    <span className="truncate text-xs font-normal text-gray-400 sm:text-sm">{item.englishName}</span>
                  ) : null}
                  {disabled ? (
                    <span className="shrink-0 text-xs font-normal text-gray-500">{t('settings.languageSoon')}</span>
                  ) : null}
                </span>
              </span>
              {selected ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-modrinth-green text-black">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="size-4" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              ) : (
                <span className="size-6 shrink-0 rounded-full border border-solid border-gray-600" />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
