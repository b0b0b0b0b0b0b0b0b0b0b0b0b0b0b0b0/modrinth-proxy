'use client'

import Link from 'next/link'
import { useT } from './I18nProvider'

export default function DisclaimerBadge() {
  const t = useT()
  return (
    <div className="relative z-10 flex justify-center pb-2 -mt-1 rounded-b-2xl pt-[5px]">
      <div className="disclaimer-badge">
        <svg className="w-3 h-3 flex-shrink-0 relative z-10" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span className="relative z-10">{t('disclaimer.unofficial')}</span>
        <Link href="/bmadnco" className="relative z-10 font-semibold transition-colors duration-200">
          {t('disclaimer.what')}
        </Link>
      </div>
    </div>
  )
}
