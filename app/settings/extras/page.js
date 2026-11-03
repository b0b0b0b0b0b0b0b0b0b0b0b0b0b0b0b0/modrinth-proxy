import { ExtrasSettings } from '../../account/AccountSettings'
import { accountSettingsMetadata, requireUser } from '../accountPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return await accountSettingsMetadata('sn.extras')
}

export default async function ExtrasSettingsPage() {
  const user = await requireUser('/settings/extras')

  return <ExtrasSettings newsBadge={!user.hide_news_badge} festive={!user.hide_festive} />
}
