'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Popover from '@radix-ui/react-popover'
import { ACCOUNT_UPDATES_KEY } from '../components/AccountUpdatesDot'
import { useT } from '../components/I18nProvider'
import StyledTooltip from '../components/StyledTooltip'

async function removeFavorites(payload) {
  const response = await fetch('/api/account/favorites', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('failed')
  try {
    sessionStorage.removeItem(ACCOUNT_UPDATES_KEY)
  } catch {}
}

export function RemoveFavoriteButton({ projectId }) {
  const t = useT()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    if (busy) return
    setBusy(true)
    try {
      await removeFavorites({ projectId })
      router.refresh()
    } catch {
      setBusy(false)
    }
  }

  return (
    <StyledTooltip label={t('account.removeFavorite')}>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        aria-label={t('account.removeFavorite')}
        className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-400 dark:text-gray-500 disabled:opacity-40"
      >
        <svg className="h-4 w-4 group-hover:hidden" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
        </svg>
        <svg className="hidden h-4 w-4 group-hover:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7ZM12 5 9.5 8l4 3-3 3 1.5 3" />
        </svg>
      </button>
    </StyledTooltip>
  )
}

async function clearHistory() {
  const response = await fetch('/api/account/history', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true }),
  })
  if (!response.ok) throw new Error('failed')
  try {
    sessionStorage.removeItem(ACCOUNT_UPDATES_KEY)
  } catch {}
}

export function ClearFavoritesButton({ count }) {
  return (
    <ClearListButton
      count={count}
      request={() => removeFavorites({ all: true })}
      labels={{ button: 'account.clearFavorites', text: 'account.clearFavoritesText' }}
    />
  )
}

export function ClearHistoryButton({ count }) {
  return (
    <ClearListButton
      count={count}
      request={clearHistory}
      labels={{ button: 'account.clearHistory', text: 'account.clearHistoryText' }}
    />
  )
}

function ClearListButton({ count, request, labels }) {
  const t = useT()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const clear = async () => {
    if (busy) return
    setBusy(true)
    setFailed(false)
    try {
      await request()
      setOpen(false)
      router.refresh()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-400 transition-colors hover:border-red-500/50 hover:text-red-400"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
          </svg>
          {t(labels.button)}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-72 max-w-[calc(100vw-24px)] rounded-xl border border-gray-700 p-4 shadow-lg shadow-black/50"
          style={{ backgroundColor: 'var(--bg-gradient-start)' }}
        >
          <div className="text-sm font-bold text-white">{t('account.clearFavoritesTitle')}</div>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">{t(labels.text, { n: count })}</p>
          {failed ? (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400" role="alert">
              {t('account.errGeneric')}
            </p>
          ) : null}
          <div className="mt-3 flex justify-end gap-2">
            <Popover.Close asChild>
              <button
                type="button"
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:text-white"
              >
                {t('account.cancelUsername')}
              </button>
            </Popover.Close>
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
              {t('account.clearFavoritesConfirm')}
            </button>
          </div>
          <Popover.Arrow className="fill-[var(--bg-gradient-start)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
