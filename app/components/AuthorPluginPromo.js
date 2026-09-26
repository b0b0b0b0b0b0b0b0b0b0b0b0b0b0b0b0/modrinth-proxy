'use client'

import { useT } from './I18nProvider'

export default function AuthorPluginPromo() {
  const t = useT()
  return (
    <div
      className="w-full max-w-none rounded-2xl border border-gray-600/80 bg-[var(--bg-tertiary)] p-4 dark:border-gray-700 sm:p-4"
      role="note"
    >
      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-[15px] sm:leading-[1.65]">
        {t('promo.authorPlugin')}
      </p>
    </div>
  )
}
