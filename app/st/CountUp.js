'use client'

import { useI18n } from '../components/I18nProvider'
import { useCountUp } from '../hooks/useCountUp'
import { intlLocale } from '@/lib/i18n/config'

export default function CountUp({ value }) {
  const { locale } = useI18n()
  const [ref, shown] = useCountUp(value, 900)

  return <span ref={ref}>{new Intl.NumberFormat(intlLocale(locale)).format(Math.round(shown))}</span>
}
