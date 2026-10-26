'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import AccountUpdatesDot, { ACCOUNT_UPDATES_KEY } from './AccountUpdatesDot'
import { useT } from './I18nProvider'
import { clearFavoritesCache } from '@/lib/favoritesCache'

const ICONS = {
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
  updates: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0'],
  favorites: [
    'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z',
  ],
  downloads: ['M12 8v4l3 2M3.05 11a9 9 0 1 1 .5 4M3 4v5h5'],
  settings: [
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
    'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  ],
  logIn: ['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3'],
  logOut: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'],
}

const ITEM =
  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-800/60 hover:text-white focus-visible:bg-gray-800/60 focus-visible:outline-none disabled:opacity-60'

function Icon({ paths, className = 'h-[18px] w-[18px] shrink-0' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function isSigned() {
  return document.cookie.includes('mp_signed=1')
}

function readUpdatesCount() {
  try {
    return JSON.parse(sessionStorage.getItem(ACCOUNT_UPDATES_KEY) || 'null')?.count || 0
  } catch {
    return 0
  }
}

export default function ProfileMenu({ account, linkClassName }) {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const menuId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState(account?.username || null)
  const [signed, setSigned] = useState(Boolean(account))
  const [updates, setUpdates] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setUsername(account?.username || null)
  }, [account?.username])

  useEffect(() => {
    setOpen(false)
    const signedNow = isSigned()
    setSigned(signedNow)
    if (!signedNow) {
      setUsername(null)
      return undefined
    }
    if (username) return undefined
    let alive = true
    fetch('/api/account/updates')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (alive && data?.username) setUsername(data.username)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [pathname])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return undefined
    setUpdates(readUpdatesCount())
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) close()
    }
    const onKey = (event) => {
      if (event.key === 'Escape') {
        close()
        rootRef.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const logout = async () => {
    setBusy(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      clearFavoritesCache()
      try {
        sessionStorage.removeItem(ACCOUNT_UPDATES_KEY)
      } catch {}
      setUsername(null)
      setSigned(false)
      close()
      if (pathname === '/account' || (pathname.startsWith('/settings/') && pathname !== '/settings/language')) {
        router.push('/')
      }
      router.refresh()
    } catch {
    } finally {
      setBusy(false)
    }
  }

  const active = pathname === '/account' || pathname.startsWith('/settings')
  const links = [
    { href: '/account?tab=updates', label: t('account.updates'), icon: ICONS.updates, count: updates },
    { href: '/account?tab=favorites', label: t('account.favorites'), icon: ICONS.favorites },
    { href: '/account?tab=downloads', label: t('account.downloads'), icon: ICONS.downloads },
  ]

  if (!signed) {
    const onAuthPage = pathname === '/login' || pathname === '/register'
    const next = onAuthPage || pathname === '/' ? '' : `?next=${encodeURIComponent(pathname)}`
    return (
      <div className="flex items-center gap-2 md:max-xl:gap-1">
        <Link
          href={`/login${next}`}
          aria-current={onAuthPage ? 'page' : undefined}
          aria-label={t('account.submitLogin')}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-modrinth-green px-2.5 text-sm font-bold text-black transition-[filter,transform] hover:brightness-110 active:scale-[0.97] max-[399px]:w-9 max-[399px]:px-0 md:max-xl:h-8 md:max-xl:w-8 md:max-xl:px-0"
        >
          <Icon paths={ICONS.logIn} />
          <span className="max-[399px]:hidden md:max-xl:hidden">{t('account.submitLogin')}</span>
        </Link>
        <Link
          href="/settings"
          className={`${linkClassName(pathname.startsWith('/settings'))} md:max-xl:h-8 md:max-xl:w-8`}
          data-tooltip={t('nav.settings')}
          aria-label={t('nav.settings')}
          aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
        >
          <Icon paths={ICONS.settings} className="h-5 w-5 shrink-0 md:max-xl:h-4 md:max-xl:w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${linkClassName(active || open)} relative`}
        data-tooltip={open ? undefined : t('sn.menu')}
        aria-label={t('sn.menu')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <Icon paths={ICONS.user} className="h-5 w-5" />
        <AccountUpdatesDot />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="menu"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-full z-[60] mt-2 w-64 rounded-2xl border border-gray-800 bg-modrinth-dark p-2 shadow-2xl"
          >
            {username ? (
              <Link
                href="/account"
                role="menuitem"
                onClick={close}
                className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-800/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--color-green-rgb),0.15)] text-sm font-extrabold uppercase text-modrinth-green">
                  {username.slice(0, 1)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-white">{username}</span>
                  <span className="block text-xs text-gray-600 dark:text-gray-500">{t('sn.dashboard')}</span>
                </span>
              </Link>
            ) : null}

            {links.map((link) => (
              <Link key={link.href} href={link.href} role="menuitem" onClick={close} className={ITEM}>
                <Icon paths={link.icon} />
                <span className="min-w-0 flex-1 truncate">{link.label}</span>
                {link.count > 0 ? (
                  <span className="rounded-full bg-modrinth-green px-1.5 py-0.5 text-[11px] font-bold leading-none text-black">
                    {link.count}
                  </span>
                ) : null}
              </Link>
            ))}

            <div className="mx-2 my-1.5 h-px bg-gray-800" role="separator" />

            <Link href="/settings" role="menuitem" onClick={close} className={ITEM}>
              <Icon paths={ICONS.settings} />
              <span className="min-w-0 flex-1 truncate">{t('nav.settings')}</span>
            </Link>

            {signed ? (
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                disabled={busy}
                className={`${ITEM} hover:!text-red-400`}
              >
                <Icon paths={ICONS.logOut} />
                <span className="min-w-0 flex-1 truncate">{t('account.logout')}</span>
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
