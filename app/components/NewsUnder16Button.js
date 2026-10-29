'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from './I18nProvider'

const UNDER_16_PLUGIN_PATHS = [
  '/plugin/borderplus',
  '/plugin/h1-(hp)',
  '/plugin/cutiedrops',
  '/plugin/soulbuyer',
]

export default function NewsUnder16Button() {
  const t = useT()
  const router = useRouter()
  const targetPath = useMemo(
    () => UNDER_16_PLUGIN_PATHS[Math.floor(Math.random() * UNDER_16_PLUGIN_PATHS.length)],
    []
  )

  return (
    <button
      type="button"
      onClick={() => router.push(targetPath)}
      className="glass-btn glass-btn--active mt-4 inline-flex w-fit cursor-pointer items-center justify-center rounded px-5 py-2 text-sm font-semibold text-modrinth-green hover:brightness-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-modrinth-green focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
    >
      {t('news.under16')}
    </button>
  )
}
