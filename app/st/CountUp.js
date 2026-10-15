'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useI18n } from '../components/I18nProvider'
import { intlLocale } from '@/lib/i18n/config'

const DURATION_MS = 900

export default function CountUp({ value }) {
  const { locale } = useI18n()
  const reduceMotion = useReducedMotion()
  const [shown, setShown] = useState(value)

  useEffect(() => {
    if (reduceMotion || value <= 0) {
      setShown(value)
      return undefined
    }
    let frame = 0
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / DURATION_MS)
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    setShown(0)
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, reduceMotion])

  return <>{new Intl.NumberFormat(intlLocale(locale)).format(shown)}</>
}
