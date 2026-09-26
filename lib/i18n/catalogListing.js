import { intlLocale } from './config'
import { getRequestT } from './server'

export function catalogUi(section, totalHits) {
  const { t, locale } = getRequestT()
  const nf = intlLocale(locale)
  const n = typeof totalHits === 'number' ? totalHits.toLocaleString(nf) : ''
  return {
    t,
    locale,
    nf,
    title: t(`catalog.${section}.title`),
    found: t(`catalog.${section}.found`, { n }),
    search: t(`catalog.${section}.search`),
    fail: t(`catalog.${section}.fail`),
    retry: t('catalog.retry'),
    loading: t('catalog.loading'),
    foundLabel: t(`catalog.${section}.foundLabel`),
    blocked: t(`catalog.${section}.blocked`),
    empty: t(`catalog.${section}.empty`),
    back: t('catalog.back'),
    next: t('catalog.next'),
  }
}
