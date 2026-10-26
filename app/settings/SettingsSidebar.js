'use client'

import { useId } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useT } from '../components/I18nProvider'
import { SETTINGS_GROUPS, SIGN_IN_ICON } from './sections'

export function SettingsIcon({ paths, className = 'h-5 w-5 shrink-0' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function NavItem({ href, label, icon, active, pillId, onNavigate }) {
  return (
    <li className="relative">
      {active ? (
        <motion.span
          layoutId={pillId}
          className="absolute inset-0 rounded-xl bg-[rgba(var(--color-green-rgb),0.15)]"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
          aria-hidden
        />
      ) : null}
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={`relative flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-[15px] font-semibold leading-tight transition-colors ${
          active ? 'text-modrinth-green' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
        }`}
      >
        <SettingsIcon paths={icon} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </Link>
    </li>
  )
}

export default function SettingsSidebar({ signedIn, onNavigate }) {
  const t = useT()
  const pathname = usePathname()
  const pillId = useId()

  return (
    <nav aria-label={t('settings.nav.aria')} className="w-full">
      <ul className="m-0 flex list-none flex-col gap-1 rounded-2xl border border-gray-800 bg-modrinth-dark p-3 pt-2">
        {SETTINGS_GROUPS.map((group) => (
          <li key={group.id} className="contents">
            <div className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">
              {t(group.labelKey)}
            </div>
            {group.auth && !signedIn ? (
              <div className="mx-1 rounded-xl border border-dashed border-gray-800 p-3">
                <p className="m-0 text-xs leading-relaxed text-gray-600 dark:text-gray-500">{t('sn.signInHint')}</p>
                <Link
                  href={`/login?next=${encodeURIComponent('/settings/profile')}`}
                  onClick={onNavigate}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-modrinth-green px-3 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90"
                >
                  <SettingsIcon paths={SIGN_IN_ICON} className="h-3.5 w-3.5" />
                  {t('sn.signIn')}
                </Link>
              </div>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={t(item.labelKey)}
                    icon={item.icon}
                    active={pathname === item.href}
                    pillId={pillId}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
