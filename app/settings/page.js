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
  return <SettingsClient />
}
