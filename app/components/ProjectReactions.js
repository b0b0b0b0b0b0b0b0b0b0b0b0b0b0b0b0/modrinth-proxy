'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Lottie from 'lottie-react'
import heartAnimation from '@/public/animations/heart.json'
import StyledTooltip from './StyledTooltip'
import { useI18n, useT } from './I18nProvider'
import { intlLocale } from '@/lib/i18n/config'

const stores = new Map()

function getStore(projectId) {
  let store = stores.get(projectId)
  if (!store) {
    store = { state: null, listeners: new Set(), loading: false, fetchedAt: 0 }
    stores.set(projectId, store)
  }
  return store
}

function publish(store, state) {
  store.state = state
  store.listeners.forEach((listener) => listener(state))
}

function useProjectState(projectId) {
  const router = useRouter()
  const pathname = usePathname()
  const store = getStore(projectId)
  const [state, setState] = useState(store.state)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    store.listeners.add(setState)
    setState(store.state)
    if (!store.loading && Date.now() - store.fetchedAt > 3000) {
      store.loading = true
      fetch(`/api/account/project?id=${encodeURIComponent(projectId)}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data) publish(store, data)
        })
        .catch(() => {})
        .finally(() => {
          store.loading = false
          store.fetchedAt = Date.now()
        })
    }
    return () => {
      store.listeners.delete(setState)
    }
  }, [projectId, store])

  const send = useCallback(
    async (payload) => {
      const current = store.state
      if (!current) return
      const goToLogin = () => router.push(`/login?next=${encodeURIComponent(pathname)}`)
      if (!current.signedIn) {
        goToLogin()
        return
      }
      setBusy(true)
      try {
        const response = await fetch('/api/account/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, ...payload }),
        })
        if (response.status === 401) goToLogin()
        else if (response.ok) publish(store, await response.json())
      } catch {
      } finally {
        setBusy(false)
      }
    },
    [pathname, projectId, router, store],
  )

  return { state, busy, send }
}

export function ProjectFavoriteButton({ projectId, className = '' }) {
  const t = useT()
  const { state, busy, send } = useProjectState(projectId)
  const favorite = state?.favorite ?? false
  const label = favorite ? t('account.favorited') : t('account.favorite')
  const lottieRef = useRef(null)
  const justClickedRef = useRef(false)

  const rest = useCallback(() => {
    const player = lottieRef.current
    if (!player) return
    if (favorite) player.goToAndStop(player.getDuration(true) - 1, true)
    else player.goToAndStop(0, true)
  }, [favorite])

  useEffect(() => {
    const player = lottieRef.current
    if (!player) return
    if (favorite && justClickedRef.current) player.goToAndPlay(0, true)
    else rest()
    justClickedRef.current = false
  }, [favorite, rest])

  const handleClick = () => {
    justClickedRef.current = true
    send({ favorite: !favorite })
  }

  return (
    <StyledTooltip label={label}>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => lottieRef.current?.goToAndPlay(0, true)}
        onMouseLeave={rest}
        disabled={busy}
        aria-pressed={favorite}
        aria-label={label}
        className={`group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full outline-none transition-transform duration-200 hover:scale-110 active:scale-90 focus-visible:ring-2 focus-visible:ring-modrinth-green lg:h-12 lg:w-12 ${className}`}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={heartAnimation}
          loop={false}
          autoplay={false}
          onDOMLoaded={rest}
          className={[
            'pointer-events-none h-full w-full transition-[filter,opacity] duration-150',
            favorite ? 'opacity-60 grayscale group-hover:opacity-90' : '',
          ].join(' ')}
        />
      </button>
    </StyledTooltip>
  )
}

export function FavoriteCount({ count, className = 'text-gray-600 dark:text-gray-400', numberClassName = 'font-semibold text-gray-900 dark:text-white', muted = false }) {
  const { t, locale } = useI18n()
  const lottieRef = useRef(null)

  const rest = useCallback(() => {
    const player = lottieRef.current
    if (player) player.goToAndStop(player.getDuration(true) - 1, true)
  }, [])

  if (!(count > 0)) return null

  return (
    <StyledTooltip label={t('account.favoritesCount', { n: count })}>
      <div
        className={`group/fav flex cursor-default items-center gap-1 ${className}`}
        onMouseEnter={() => lottieRef.current?.goToAndPlay(0, true)}
        onMouseLeave={rest}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={heartAnimation}
          loop={false}
          autoplay={false}
          onDOMLoaded={rest}
          className={`pointer-events-none -my-1.5 h-7 w-7 transition-[filter,opacity] duration-150 ${muted ? 'opacity-60 grayscale group-hover/fav:opacity-100 group-hover/fav:grayscale-0' : ''}`}
        />
        <span className={numberClassName}>
          {new Intl.NumberFormat(intlLocale(locale), { notation: 'compact', maximumFractionDigits: 1 }).format(count)}
        </span>
      </div>
    </StyledTooltip>
  )
}

export function ProjectFavoriteCount({ projectId }) {
  const { state } = useProjectState(projectId)
  return <FavoriteCount count={state?.favorites ?? 0} />
}
