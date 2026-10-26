import { getSessionUser } from '@/lib/auth'
import { getRequestT } from '@/lib/i18n/server'
import SettingsSidebar from './SettingsSidebar'
import SettingsMobileMenu from './SettingsMobileMenu'

export const dynamic = 'force-dynamic'

export default function SettingsLayout({ children }) {
  const { t } = getRequestT()
  const signedIn = Boolean(getSessionUser())

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold text-white mb-6">{t('settings.pageTitle')}</h1>
      <SettingsMobileMenu signedIn={signedIn} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0">
          <div className="sticky top-4">
            <SettingsSidebar signedIn={signedIn} />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
