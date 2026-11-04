import { getNotifyMutes } from '@/lib/account'
import { telegramBotId } from '@/lib/telegramAuth'
import { NotificationSettings } from '../../account/AccountSettings'
import { accountSettingsMetadata, requireUser } from '../accountPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return await accountSettingsMetadata('sn.notifications')
}

export default async function NotificationSettingsPage() {
  const user = await requireUser('/settings/notifications')
  const devTelegram = process.env.NODE_ENV !== 'production'

  return (
    <NotificationSettings
      telegram={{
        botId: telegramBotId() || (devTelegram ? 'dev' : null),
        linked: devTelegram || Boolean(user.telegram_id),
        notify: Boolean(user.telegram_notify),
        quiet: Boolean(user.quiet_nights),
        timezone: user.timezone || '',
        quietFrom: user.quiet_from,
        quietTo: user.quiet_to,
      }}
      trackDownloads={!user.skip_download_updates}
      mutedCount={getNotifyMutes(user.id).size}
    />
  )
}
