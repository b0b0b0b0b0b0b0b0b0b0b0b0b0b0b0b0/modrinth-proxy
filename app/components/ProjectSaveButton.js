'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Popover from '@radix-ui/react-popover'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import StyledTooltip from './StyledTooltip'
import { useT } from './I18nProvider'

const BOOKMARK = 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'
const NAME_MAX = 64
const SAVED_KEY = 'mp-collections-saved'
const SAVED_LIMIT = 500

const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect
const pending = new Map()

function isSigned() {
  return typeof document !== 'undefined' && document.cookie.includes('mp_signed=1')
}

function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null')
    return Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

function rememberSaved(projectId, saved) {
  const ids = new Set(readSaved() || [])
  if (saved) ids.add(projectId)
  else ids.delete(projectId)
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...ids].slice(-SAVED_LIMIT)))
  } catch {}
}

export function clearSavedCollectionsCache() {
  try {
    localStorage.removeItem(SAVED_KEY)
  } catch {}
}

function loadState(projectId) {
  let promise = pending.get(projectId)
  if (!promise) {
    promise = fetch(`/api/account/collections?projectId=${encodeURIComponent(projectId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
      .finally(() => setTimeout(() => pending.delete(projectId), 3000))
    pending.set(projectId, promise)
  }
  return promise
}

async function request(method, body) {
  const response = await fetch('/api/account/collections', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)
  if (response.status === 401) return { signedOut: true }
  if (!response.ok) return { error: data?.error || 'failed' }
  return data
}

function Check({ on }) {
  return (
    <span
      className={[
        'glass-check flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors',
        on ? 'bg-modrinth-green text-black' : 'bg-[var(--bg-tertiary)] text-transparent group-hover/check:bg-gray-700',
      ].join(' ')}
      aria-hidden
    >
      {on ? (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : null}
    </span>
  )
}

export default function ProjectSaveButton({ projectId, className = '' }) {
  const t = useT()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState(null)
  const [guess, setGuess] = useState(false)
  const bounceRef = useRef(false)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const nameRef = useRef(null)

  useBeforePaint(() => {
    setGuess(isSigned() && Boolean(readSaved()?.includes(projectId)))
  }, [projectId])

  useEffect(() => {
    if (!isSigned()) {
      setState({ signedIn: false, collections: [] })
      return
    }
    let alive = true
    loadState(projectId).then((data) => {
      if (alive && data) setState(data)
    })
    return () => {
      alive = false
    }
  }, [projectId])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setCreating(false)
      setName('')
      setError('')
    }
  }, [open])

  useEffect(() => {
    if (creating) nameRef.current?.focus()
  }, [creating])

  const collections = state?.collections ?? []
  const saved = state?.signedIn ? collections.some((collection) => collection.has) : state ? false : guess

  useEffect(() => {
    if (state?.signedIn) rememberSaved(projectId, saved)
  }, [state, saved, projectId])
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? collections.filter((collection) => collection.name.toLowerCase().includes(needle)) : collections
  }, [collections, query])

  const apply = (data) => {
    if (data?.signedOut) {
      setState({ signedIn: false, collections: [] })
      return false
    }
    if (data?.error) {
      setError(data.error === 'limit' ? t('ucol.errLimit') : t('ucol.errGeneric'))
      return false
    }
    setError('')
    if (data?.collections) setState({ signedIn: true, collections: data.collections })
    return true
  }

  const toggle = async (collection) => {
    if (busy) return
    const on = !collection.has
    bounceRef.current = true
    setBusy(collection.id)
    setState((current) => ({
      ...current,
      collections: current.collections.map((item) => (item.id === collection.id ? { ...item, has: on } : item)),
    }))
    const data = await request('PATCH', { id: collection.id, projectId, on }).catch(() => ({ error: 'failed' }))
    if (!apply(data)) {
      setState((current) => ({
        ...current,
        collections: current.collections.map((item) => (item.id === collection.id ? { ...item, has: !on } : item)),
      }))
    }
    setBusy(null)
  }

  const create = async (event) => {
    event.preventDefault()
    const clean = name.replace(/\s+/g, ' ').trim()
    if (!clean || busy) return
    setBusy('new')
    bounceRef.current = true
    const data = await request('POST', { name: clean, projectId }).catch(() => ({ error: 'failed' }))
    if (apply(data)) {
      setCreating(false)
      setName('')
      setQuery('')
    }
    setBusy(null)
  }

  const label = saved ? t('ucol.saved') : t('ucol.save')
  const authQuery = `?next=${encodeURIComponent(pathname)}`

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <StyledTooltip label={label}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={label}
            aria-pressed={saved}
            className={`group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full outline-none transition-[transform,background-color] duration-200 hover:scale-110 hover:bg-gray-800/50 active:scale-90 focus-visible:ring-2 focus-visible:ring-modrinth-green data-[state=open]:bg-gray-800/60 lg:h-12 lg:w-12 ${className}`}
          >
            <motion.svg
              key={saved ? 'on' : 'off'}
              initial={bounceRef.current && !reduceMotion ? { scale: 0.6, y: -3 } : false}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 18 }}
              className={`h-6 w-6 transition-colors ${saved ? 'text-modrinth-green' : 'text-gray-400 group-hover:text-white'}`}
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d={BOOKMARK} />
            </motion.svg>
          </button>
        </Popover.Trigger>
      </StyledTooltip>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-80 max-w-[calc(100vw-24px)] rounded-xl border border-gray-700 p-3 shadow-lg shadow-black/50"
          style={{ backgroundColor: 'var(--bg-gradient-start)' }}
          aria-label={t('ucol.save')}
        >
          {state && !state.signedIn ? (
            <div className="p-1">
              <div className="text-sm font-bold text-white">{t('ucol.loginTitle')}</div>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">{t('ucol.loginText')}</p>
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
            </div>
          ) : (
            <>
              {collections.length > 5 ? (
                <label className="mb-2 flex h-9 items-center gap-2 rounded-xl border border-gray-700 bg-[var(--bg-primary)] px-3 text-gray-500 focus-within:text-white">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                    <path d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('ucol.search')}
                    spellCheck={false}
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-white outline-none placeholder:text-gray-500 focus:ring-0"
                  />
                </label>
              ) : null}

              <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-800 bg-[var(--bg-primary)] p-1.5">
                {shown.length > 0 ? (
                  shown.map((collection) => (
                    <button
                      key={collection.id}
                      type="button"
                      role="checkbox"
                      aria-checked={collection.has}
                      onClick={() => toggle(collection)}
                      disabled={busy === collection.id}
                      className="group/check flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-800/60 hover:text-white focus-visible:bg-gray-800/60 focus-visible:outline-none"
                    >
                      <Check on={collection.has} />
                      <span className="min-w-0 flex-1 truncate">{collection.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-3 text-center text-xs text-gray-500">
                    {collections.length > 0 ? t('ucol.nothingFound') : state ? t('ucol.none') : '…'}
                  </p>
                )}
              </div>

              <AnimatePresence initial={false} mode="wait">
                {creating ? (
                  <motion.form
                    key="form"
                    onSubmit={create}
                    initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-2 space-y-2"
                  >
                    <input
                      ref={nameRef}
                      type="text"
                      value={name}
                      maxLength={NAME_MAX}
                      onChange={(event) => setName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.stopPropagation()
                          setCreating(false)
                        }
                      }}
                      placeholder={t('ucol.namePlaceholder')}
                      className="h-9 w-full rounded-xl border border-gray-700 bg-[var(--bg-primary)] px-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-modrinth-green/60 focus:ring-0"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCreating(false)}
                        className="h-9 flex-1 rounded-xl border border-gray-700 text-sm font-semibold text-gray-300 transition-colors hover:text-white"
                      >
                        {t('ucol.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={!name.trim() || busy === 'new'}
                        className="h-9 flex-1 rounded-xl bg-modrinth-green text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {t('ucol.add')}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.button
                    key="button"
                    type="button"
                    onClick={() => setCreating(true)}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-gray-800/70 text-sm font-semibold text-white transition-colors hover:bg-gray-700/70"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {t('ucol.create')}
                  </motion.button>
                )}
              </AnimatePresence>

              {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
            </>
          )}
          <Popover.Arrow className="fill-[var(--bg-gradient-start)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
