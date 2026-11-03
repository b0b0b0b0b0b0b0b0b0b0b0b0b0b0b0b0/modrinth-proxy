import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getRequestT } from '@/lib/i18n/server'

export async function requireUser(path) {
  const user = await getSessionUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`)
  return user
}

export async function accountSettingsMetadata(labelKey) {
  const { t } = await getRequestT()
  return {
    title: `${t(labelKey)} | ${t('settings.metaTitle')}`,
    robots: 'noindex, nofollow',
  }
}
