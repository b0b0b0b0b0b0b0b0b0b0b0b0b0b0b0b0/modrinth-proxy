import { getDownloadsPage, getFavorites } from '@/lib/account'
import { DataSettings } from '../../account/AccountSettings'
import { accountSettingsMetadata, requireUser } from '../accountPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return await accountSettingsMetadata('sn.data')
}

export default async function DataSettingsPage() {
  const user = await requireUser('/settings/data')
  const favorites = getFavorites(user.id)
  const downloads = getDownloadsPage(user.id, 1).all

  return (
    <DataSettings
      recordHistory={Boolean(user.record_history)}
      counts={{ favorites: favorites.length, downloads }}
    />
  )
}
