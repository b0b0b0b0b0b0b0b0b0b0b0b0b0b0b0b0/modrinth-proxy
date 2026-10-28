'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Popover from '@radix-ui/react-popover'
import { useT } from '../components/I18nProvider'
import StyledTooltip from '../components/StyledTooltip'

const NAME_MAX = 64
const POPOVER = 'z-50 w-72 max-w-[calc(100vw-24px)] rounded-xl border border-gray-700 p-4 shadow-lg shadow-black/50'
const INPUT =
  'h-9 w-full rounded-xl border border-gray-700 bg-[var(--bg-primary)] px-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-modrinth-green/60 focus:ring-0'
const CANCEL =
  'rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:text-white'
const CONFIRM =
  'inline-flex items-center gap-1.5 rounded-lg bg-modrinth-green px-3 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50'

async function send(method, body) {
  const response = await fetch('/api/account/collections', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || 'failed')
  return data
}

function errorText(t, error) {
  return error?.message === 'limit' ? t('ucol.errLimit') : t('ucol.errGeneric')
}

function NamePopover({ trigger, title, initial = '', submitLabel, onSubmit }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setName(initial)
      setError('')
    }
  }, [open, initial])

  const submit = async (event) => {
    event.preventDefault()
    const clean = name.replace(/\s+/g, ' ').trim()
    if (!clean || busy) return
    setBusy(true)
    setError('')
    try {
      await onSubmit(clean)
      setOpen(false)
    } catch (failure) {
      setError(errorText(t, failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className={POPOVER}
          style={{ backgroundColor: 'var(--bg-gradient-start)' }}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
            inputRef.current?.select()
          }}
        >
          <form onSubmit={submit}>
            <div className="text-sm font-bold text-white">{title}</div>
            <input
              ref={inputRef}
              type="text"
              value={name}
              maxLength={NAME_MAX}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('ucol.namePlaceholder')}
              className={`mt-2 ${INPUT}`}
            />
            {error ? (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-3 flex justify-end gap-2">
              <Popover.Close asChild>
                <button type="button" className={CANCEL}>
                  {t('ucol.cancel')}
                </button>
              </Popover.Close>
              <button type="submit" disabled={busy || !name.trim()} className={CONFIRM}>
                {busy ? <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" /> : null}
                {submitLabel}
              </button>
            </div>
          </form>
          <Popover.Arrow className="fill-[var(--bg-gradient-start)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function CreateCollectionButton() {
  const t = useT()
  const router = useRouter()

  return (
    <NamePopover
      title={t('ucol.create')}
      submitLabel={t('ucol.add')}
      onSubmit={async (name) => {
        const { id } = await send('POST', { name })
        router.push(`/account?tab=collections&c=${id}`)
        router.refresh()
      }}
      trigger={
        <button
          type="button"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-modrinth-green px-3 text-sm font-bold text-black transition-[opacity,transform] hover:opacity-90 active:scale-[0.97]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('ucol.createShort')}
        </button>
      }
    />
  )
}

export function RenameCollectionButton({ id, name }) {
  const t = useT()
  const router = useRouter()

  return (
    <NamePopover
      title={t('ucol.rename')}
      initial={name}
      submitLabel={t('ucol.save_name')}
      onSubmit={async (next) => {
        await send('PATCH', { id, name: next })
        router.refresh()
      }}
      trigger={
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
          {t('ucol.rename')}
        </button>
      }
    />
  )
}

export function DeleteCollectionButton({ id, name }) {
  const t = useT()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const remove = async () => {
    if (busy) return
    setBusy(true)
    setFailed(false)
    try {
      await send('DELETE', { id })
      setOpen(false)
      router.push('/account?tab=collections')
      router.refresh()
    } catch {
      setFailed(true)
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
          {t('ucol.delete')}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className={POPOVER}
          style={{ backgroundColor: 'var(--bg-gradient-start)' }}
        >
          <div className="text-sm font-bold text-white">{t('ucol.delete')}?</div>
          <p className="mt-1 break-words text-xs leading-relaxed text-gray-400">{t('ucol.deleteText', { name })}</p>
          {failed ? (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400" role="alert">
              {t('ucol.errGeneric')}
            </p>
          ) : null}
          <div className="mt-3 flex justify-end gap-2">
            <Popover.Close asChild>
              <button type="button" className={CANCEL}>
                {t('ucol.cancel')}
              </button>
            </Popover.Close>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
              {t('ucol.deleteConfirm')}
            </button>
          </div>
          <Popover.Arrow className="fill-[var(--bg-gradient-start)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function RemoveFromCollectionButton({ id, projectId }) {
  const t = useT()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    if (busy) return
    setBusy(true)
    try {
      await send('PATCH', { id, projectId, on: false })
      router.refresh()
    } catch {
      setBusy(false)
    }
  }

  return (
    <StyledTooltip label={t('ucol.remove')}>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        aria-label={t('ucol.remove')}
        className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-modrinth-green transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
      >
        <svg className="h-4 w-4 group-hover:hidden" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <svg className="hidden h-4 w-4 group-hover:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </StyledTooltip>
  )
}
