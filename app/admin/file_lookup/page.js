import FileLookupClient from './FileLookupClient'
import { getRequestT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('lookup.metaTitle'),
    description: t('lookup.metaDesc'),
    robots: { index: false, follow: false },
  }
}

export default function FileLookupPage() {
  const { t } = getRequestT()
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-extrabold text-white">{t('lookup.title')}</h1>
      <p className="mb-8 text-sm text-gray-400 md:text-base">{t('lookup.lead')}</p>
      <FileLookupClient />
    </div>
  )
}
