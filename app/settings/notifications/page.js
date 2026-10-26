import { getNotifyMutes } from '@/lib/account'
import { telegramBotId } from '@/lib/telegramAuth'
import { NotificationSettings } from '../../account/AccountSettings'
import { accountSettingsMetadata, requireUser } from '../accountPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return accountSettingsMetadata('sn.notifications')
}

export default function NotificationSettingsPage() {
  const user = requireUser('/settings/notifications')

  return (
    <NotificationSettings
      telegram={{ botId: telegramBotId(), linked: Boolean(user.telegram_id), notify: Boolean(user.telegram_notify) }}
      trackDownloads={!user.skip_download_updates}
      mutedCount={getNotifyMutes(user.id).size}
    />
  )
}
