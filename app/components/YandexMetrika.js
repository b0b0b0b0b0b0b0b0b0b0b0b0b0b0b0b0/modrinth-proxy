'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { METRIKA_ID, isMetrikaPrivatePath } from '@/lib/metrika'

const TAG_URL = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`

function loadMetrika() {
  if (window.ym) return
  window.ym = function ym() {
    ;(window.ym.a = window.ym.a || []).push(arguments)
  }
  window.ym.l = Date.now()
  const script = document.createElement('script')
  script.async = true
  script.src = TAG_URL
  document.head.appendChild(script)
  window.ym(METRIKA_ID, 'init', {
    ssr: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    accurateTrackBounce: true,
    trackLinks: true,
  })
}

export default function YandexMetrika() {
  const pathname = usePathname()

  useEffect(() => {
    const hidden = isMetrikaPrivatePath(pathname)
    window[`disableYaCounter${METRIKA_ID}`] = hidden
    if (!hidden) loadMetrika()
  }, [pathname])

  return null
}
