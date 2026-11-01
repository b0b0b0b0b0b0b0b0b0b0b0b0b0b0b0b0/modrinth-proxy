'use client'

import { usePathname } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import Crumbs from '../components/Crumbs'
import { SETTINGS_GROUPS } from './sections'

export default function SettingsCrumbs() {
  const t = useT()
  const pathname = usePathname()
  const group = SETTINGS_GROUPS.find((entry) => entry.items.some((item) => item.href === pathname))
  const item = group?.items.find((entry) => entry.href === pathname)
  const title = item ? t(item.labelKey) : t('settings.pageTitle')

  return (
    <div className="mb-6">
      <Crumbs
        label={t('nav.navigation')}
        items={[
          { href: '/', label: t('nav.home') },
          { href: '/account', label: t('account.title') },
          { label: title },
        ]}
      />
      <h1 className="mt-2 text-3xl font-extrabold text-white">{title}</h1>
    </div>
  )
}
