import LanguageSettingsCard from '../../components/LanguageSettingsCard'
import { getRequestT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('settings.metaTitle'),
    robots: 'noindex, nofollow',
  }
}

export default function LanguageSettingsPage() {
  return <LanguageSettingsCard />
}
