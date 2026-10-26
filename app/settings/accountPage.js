import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getRequestT } from '@/lib/i18n/server'

export function requireUser(path) {
  const user = getSessionUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`)
  return user
}

export function accountSettingsMetadata(labelKey) {
  const { t } = getRequestT()
  return {
    title: `${t(labelKey)} | ${t('settings.metaTitle')}`,
    robots: 'noindex, nofollow',
  }
}
