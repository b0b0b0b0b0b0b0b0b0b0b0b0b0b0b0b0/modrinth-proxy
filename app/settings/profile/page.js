import { getGameProfile } from '@/lib/account'
import { getRequestT } from '@/lib/i18n/server'
import { HeaderKitten } from '../../account/AccountKitten'
import { GameSettings } from '../../account/AccountSettings'
import UsernameEditor from '../../account/UsernameEditor'
import MinecraftAvatarPicker, { AvatarImage } from '../../account/MinecraftAvatarPicker'
import { userAvatarUrl } from '@/lib/minecraftAvatar'
import { accountSettingsMetadata, requireUser } from '../accountPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return accountSettingsMetadata('sn.profile')
}

function profileFields(source) {
  return {
    loader: source.loader || '',
    gameVersion: source.gameVersion || '',
    serverCore: source.serverCore || '',
    serverVersion: source.serverVersion || '',
  }
}

export default function ProfileSettingsPage() {
  const { t } = getRequestT()
  const user = requireUser('/settings/profile')
  const profile = getGameProfile(user.id)
  const chosen = profileFields(profile.chosen)
  const avatar = userAvatarUrl(user)

  return (
    <>
      <section className="universal-card settings-section">
        <h2 className="text-xl font-bold text-white mb-4">{t('sn.profile')}</h2>
        <div className="flex min-w-0 items-center gap-3">
          {avatar ? <AvatarImage src={avatar} /> : <HeaderKitten />}
          <UsernameEditor username={user.username} heading="div" />
        </div>
        <MinecraftAvatarPicker avatar={avatar} name={user.mc_name} />
      </section>
      <GameSettings key={Object.values(chosen).join('|')} game={{ chosen, guess: profileFields(profile.guess) }} />
    </>
  )
}
