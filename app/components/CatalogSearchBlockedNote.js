import { getRequestT } from '@/lib/i18n/server'
import { intlLocale } from '@/lib/i18n/config'
import { pluralize } from '@/lib/i18n/pluralize'

export default function CatalogSearchBlockedNote({ count }) {
  const { t, locale } = getRequestT()
  if (!(count > 0)) return null
  const n = Number(count).toLocaleString(intlLocale(locale))
  const text = pluralize(
    count,
    locale,
    t('catalog.blockedOne', { n }),
    t('catalog.blockedFew', { n }),
    t('catalog.blockedMany', { n }),
  )
  return <span className="catalog-search-blocked-note">{text}</span>
}
