'use client'

import { useEffect, useState } from 'react'
import { useT } from '../components/I18nProvider'

export function detectOS() {
  if (typeof navigator === 'undefined') return null
  const platform = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase()
  const ua = (navigator.userAgent || '').toLowerCase()
  const src = `${platform} ${ua}`

  if (/android/.test(src)) return 'Android'
  if (/iphone|ipad|ipod/.test(src)) return 'iOS'
  if (/win/.test(src)) return 'Windows'
  if (/mac/.test(src)) return 'macOS'
  if (/linux|x11|ubuntu|fedora|debian/.test(src)) return 'Linux'
  return null
}

export default function DetectedOS() {
  const t = useT()
  const [os, setOs] = useState(null)

  useEffect(() => {
    setOs(detectOS())
  }, [])

  if (!os) return null

  return (
    <p className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-modrinth-green opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-modrinth-green" />
      </span>
      {t('app.detected')}{' '}
      <span className="font-semibold text-modrinth-green">{os}</span>
    </p>
  )
}
