import { ExtrasSettings } from '../../account/AccountSettings'
import { accountSettingsMetadata, requireUser } from '../accountPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return accountSettingsMetadata('sn.extras')
}

export default function ExtrasSettingsPage() {
  const user = requireUser('/settings/extras')

  return <ExtrasSettings newsBadge={!user.hide_news_badge} festive={!user.hide_festive} />
}
