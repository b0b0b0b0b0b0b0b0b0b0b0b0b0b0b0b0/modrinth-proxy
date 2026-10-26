import { buildFavoritesCode, getDownloadsPage, getFavorites } from '@/lib/account'
import { githubAuthEnabled } from '@/lib/githubAuth'
import { telegramBotId } from '@/lib/telegramAuth'
import { getRequestT } from '@/lib/i18n/server'
import DeleteAccount from '../../account/DeleteAccount'
import LogoutButton from '../../account/LogoutButton'
import SignInMethods from '../../account/SignInMethods'
import { accountSettingsMetadata, requireUser } from '../accountPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return accountSettingsMetadata('sn.security')
}

export default function SecuritySettingsPage({ searchParams }) {
  const { t } = getRequestT()
  const user = requireUser('/settings/security')
  const githubEnabled = githubAuthEnabled()
  const telegramBot = telegramBotId()
  const favorites = getFavorites(user.id)

  return (
    <>
      <section className="universal-card settings-section">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">{t('account.signin')}</h2>
          <LogoutButton />
        </div>
        <SignInMethods
          hasPassword={Boolean(user.has_password)}
          username={user.username}
          takenProvider={searchParams?.taken || null}
          providers={[
            ...(githubEnabled || user.github_id ? [{ id: 'github', linked: Boolean(user.github_id) }] : []),
            ...(telegramBot || user.telegram_id
              ? [{ id: 'telegram', linked: Boolean(user.telegram_id), botId: telegramBot }]
              : []),
          ]}
        />
      </section>
      <DeleteAccount
        username={user.username}
        favorites={favorites.length}
        favoritesCode={favorites.length > 0 ? buildFavoritesCode(favorites.map((row) => row.project_id)) : ''}
        favoriteTitles={favorites.map((row) => row.title)}
        downloads={getDownloadsPage(user.id, 1).all}
        linkedNames={[...(user.github_id ? ['GitHub'] : []), ...(user.telegram_id ? ['Telegram'] : [])]}
      />
    </>
  )
}
