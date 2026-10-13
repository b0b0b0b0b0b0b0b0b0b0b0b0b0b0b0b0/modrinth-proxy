'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Popover from '@radix-ui/react-popover'
import Lottie from 'lottie-react'
import heartAnimation from '@/public/animations/heart.json'
import StyledTooltip from './StyledTooltip'
import { useI18n, useT } from './I18nProvider'
import { intlLocale } from '@/lib/i18n/config'
import { guessFavorite, updateFavoritesCache } from '@/lib/favoritesCache'

const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect

const stores = new Map()

function getStore(projectId) {
  let store = stores.get(projectId)
  if (!store) {
    store = { state: null, listeners: new Set(), loading: false, fetchedAt: 0 }
    stores.set(projectId, store)
  }
  return store
}

function publish(store, state, projectId) {
  store.state = state
  if (state?.signedIn) updateFavoritesCache(projectId, Boolean(state.favorite))
  store.listeners.forEach((listener) => listener(state))
}

function useProjectState(projectId) {
  const store = getStore(projectId)
  const [state, setState] = useState(store.state)
  const [busy, setBusy] = useState(false)
  const [guess, setGuess] = useState(null)

  useBeforePaint(() => {
    setGuess(guessFavorite(projectId))
  }, [projectId])

  useEffect(() => {
    store.listeners.add(setState)
    setState(store.state)
    if (!store.loading && Date.now() - store.fetchedAt > 3000) {
      store.loading = true
      fetch(`/api/account/project?id=${encodeURIComponent(projectId)}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data) publish(store, data, projectId)
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
      if (!current) return false
      if (!current.signedIn) return true
      setBusy(true)
      try {
        const response = await fetch('/api/account/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, ...payload }),
        })
        if (response.status === 401) return true
        if (response.ok) publish(store, await response.json(), projectId)
      } catch {
      } finally {
        setBusy(false)
      }
      return false
    },
    [projectId, store],
  )

  return { state, busy, send, guess }
}

export function ProjectFavoriteButton({ projectId, className = '' }) {
  const t = useT()
  const { state, busy, send, guess } = useProjectState(projectId)
  const favorite = state?.favorite ?? guess ?? false
  const ready = state !== null || guess !== null
  const label = favorite ? t('account.favorited') : t('account.favorite')
  const pathname = usePathname()
  const [asking, setAsking] = useState(false)
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

  const handleClick = async () => {
    justClickedRef.current = Boolean(state?.signedIn)
    if (await send({ favorite: !favorite })) setAsking(true)
  }

  const authQuery = `?next=${encodeURIComponent(pathname)}`

  return (
    <Popover.Root open={asking} onOpenChange={setAsking}>
    <StyledTooltip label={label}>
      <Popover.Anchor asChild>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => lottieRef.current?.goToAndPlay(0, true)}
        onMouseLeave={rest}
        disabled={busy}
        aria-pressed={favorite}
        aria-label={label}
        className={`group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full outline-none transition-[transform,opacity] duration-200 ${ready ? 'opacity-100' : 'opacity-0'} hover:scale-110 active:scale-90 focus-visible:ring-2 focus-visible:ring-modrinth-green lg:h-12 lg:w-12 ${className}`}
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
      </Popover.Anchor>
    </StyledTooltip>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-80 max-w-[calc(100vw-24px)] rounded-xl border border-gray-700 p-4 shadow-lg shadow-black/50"
          style={{ backgroundColor: 'var(--bg-gradient-start)' }}
        >
          <div className="text-sm font-bold text-white">{t('account.favLoginTitle')}</div>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">{t('account.favLoginText')}</p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Link
              href={`/register${authQuery}`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold leading-none text-gray-300 transition-colors hover:text-white"
            >
              {t('account.submitRegister')}
            </Link>
            <Link
              href={`/login${authQuery}`}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-modrinth-green px-3 py-1.5 text-xs font-bold leading-none text-black transition-opacity hover:opacity-90"
            >
              {t('account.submitLogin')}
            </Link>
          </div>
          <Popover.Arrow className="fill-[var(--bg-gradient-start)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
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
