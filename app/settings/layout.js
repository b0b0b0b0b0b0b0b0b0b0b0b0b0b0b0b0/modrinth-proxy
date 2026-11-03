import { getSessionUser } from '@/lib/auth'
import SettingsCrumbs from './SettingsCrumbs'
import SettingsSidebar from './SettingsSidebar'
import SettingsMobileMenu from './SettingsMobileMenu'

export const dynamic = 'force-dynamic'

export default async function SettingsLayout({ children }) {
  const signedIn = Boolean(await getSessionUser())

  return (
    <div className="max-w-7xl mx-auto py-8">
      <SettingsCrumbs />
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
