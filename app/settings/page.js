import SettingsClient from './SettingsClient'
import { getRequestT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('settings.metaTitle'),
    description: t('settings.metaDesc'),
    robots: 'noindex, nofollow',
  }
}

export default function SettingsPage() {
  const { t } = getRequestT()
  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold text-white mb-2" id="settings-title">{t('settings.pageTitle')}</h1>
      <p className="text-gray-400 mb-8 text-sm md:text-base">{t('settings.pageHint')}</p>
      <SettingsClient />
    </div>
  )
}
