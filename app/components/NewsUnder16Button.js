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
      className="mt-4 inline-flex w-fit cursor-pointer items-center justify-center rounded border border-modrinth-green/50 bg-modrinth-green/10 px-5 py-2 text-sm font-semibold text-modrinth-green transition-[color,background-color,border-color] duration-150 hover:border-modrinth-green/80 hover:bg-modrinth-green/[0.14] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-modrinth-green focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
    >
      {t('news.under16')}
    </button>
  )
}
