'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Popover from '@radix-ui/react-popover'
import { motion, useReducedMotion } from 'framer-motion'
import { useT } from '../components/I18nProvider'

const NAME_RE = /^[A-Za-z0-9_]{1,16}$/
const LOOKUP_DELAY_MS = 450
const ERRORS = {
  invalid: 'mcava.invalid',
  not_found: 'mcava.notFound',
  mojang: 'mcava.mojang',
  rate_limit: 'mcava.rateLimit',
}

export function CreeperIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden>
      <path d="M1 2h2v2H1zM5 2h2v2H5zM3 4h2v1H3zM2 5h4v2H5V6H3v1H2z" fill="currentColor" />
    </svg>
  )
}

export function AvatarImage({ src, className = 'h-11 w-11' }) {
  return (
    <img
      src={src}
      alt=""
      width={128}
      height={128}
      draggable={false}
      className={`shrink-0 -scale-x-100 scale-y-[1.12] object-contain ${className}`}
    />
  )
}

function errorText(t, code) {
  return t(ERRORS[code] || 'mcava.fail')
}

export default function MinecraftAvatarPicker({ avatar, name }) {
  const t = useT()
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(name || '')
  const [lookup, setLookup] = useState({ state: 'idle' })
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const timerRef = useRef(null)
  const abortRef = useRef(null)
  const inputRef = useRef(null)

  const stop = () => {
    abortRef.current?.abort()
    clearTimeout(timerRef.current)
  }

  useEffect(() => stop, [])

  const run = async (nick) => {
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const response = await fetch(`/api/account/avatar?name=${encodeURIComponent(nick)}`, { signal: controller.signal })
      const data = await response.json().catch(() => ({}))
      if (controller.signal.aborted) return
      if (response.ok && data.image) setLookup({ state: 'found', name: data.name, image: data.image })
      else setLookup({ state: 'error', code: data.error })
    } catch {
      if (!controller.signal.aborted) setLookup({ state: 'error', code: 'mojang' })
    }
  }

  const schedule = (raw) => {
    const nick = raw.trim()
    stop()
    if (!nick) return setLookup({ state: 'idle' })
    if (!NAME_RE.test(nick)) return setLookup({ state: 'error', code: 'invalid' })
    setLookup({ state: 'loading' })
    timerRef.current = setTimeout(() => run(nick), LOOKUP_DELAY_MS)
  }

  const onOpenChange = (next) => {
    setOpen(next)
    setFailure('')
    if (next) {
      setValue(name || '')
      schedule(name || '')
    } else {
      stop()
    }
  }

  const send = async (method, body) => {
    if (busy) return
    setBusy(true)
    setFailure('')
    try {
      const response = await fetch('/api/account/avatar', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setFailure(errorText(t, data.error))
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setFailure(t('mcava.fail'))
    } finally {
      setBusy(false)
    }
  }

  const apply = (event) => {
    event.preventDefault()
    if (lookup.state === 'found') send('POST', { name: lookup.name })
  }

  const status =
    lookup.state === 'loading'
      ? { text: t('mcava.searching'), tone: 'text-gray-500' }
      : lookup.state === 'found'
        ? { text: t('mcava.found', { name: lookup.name }), tone: 'text-modrinth-green' }
        : lookup.state === 'error'
          ? { text: errorText(t, lookup.code), tone: 'text-amber-600 dark:text-amber-400' }
          : { text: t('mcava.hint'), tone: 'text-gray-500' }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-[var(--bg-primary)] p-4">
      {avatar ? (
        <AvatarImage src={avatar} className="h-16 w-16" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-tertiary)] text-gray-500">
          <CreeperIcon className="h-8 w-8" />
        </div>
      )}
      <div className="min-w-0 flex-1 basis-40">
        <div className="text-sm font-bold text-white">{t('mcava.title')}</div>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
          {avatar && name ? t('mcava.current', { name }) : t('mcava.lead')}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {avatar ? (
          <button
            type="button"
            onClick={() => send('DELETE')}
            disabled={busy}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            {t('mcava.remove')}
          </button>
        ) : null}
        <Popover.Root open={open} onOpenChange={onOpenChange}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-modrinth-green px-3 text-sm font-bold text-black transition-[opacity,transform] hover:opacity-90 active:scale-[0.97]"
            >
              <CreeperIcon className="h-4 w-4" />
              {avatar ? t('mcava.change') : t('mcava.pick')}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="end"
              sideOffset={8}
              collisionPadding={12}
              className="z-50 w-80 max-w-[calc(100vw-24px)] rounded-xl p-4 shadow-lg shadow-black/50"
              style={{ backgroundColor: 'var(--bg-gradient-start)' }}
              onOpenAutoFocus={(event) => {
                event.preventDefault()
                inputRef.current?.focus()
                inputRef.current?.select()
              }}
            >
              <form onSubmit={apply}>
                <div className="text-sm font-bold text-white">{t('mcava.title')}</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-tertiary)] text-gray-500">
                    {lookup.state === 'found' ? (
                      <motion.div
                        key={lookup.image}
                        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                      >
                        <AvatarImage src={lookup.image} className="h-14 w-14" />
                      </motion.div>
                    ) : (
                      <CreeperIcon className={`h-7 w-7 ${lookup.state === 'loading' ? 'animate-pulse' : ''}`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={value}
                      maxLength={16}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={t('mcava.placeholder')}
                      onChange={(event) => {
                        setValue(event.target.value)
                        setFailure('')
                        schedule(event.target.value)
                      }}
                      className="h-9 w-full rounded-xl bg-[var(--bg-primary)] px-3 text-sm text-white outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-modrinth-green/50"
                    />
                    <p className={`mt-1 truncate text-xs ${status.tone}`}>{status.text}</p>
                  </div>
                </div>
                {failure ? (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400" role="alert">
                    {failure}
                  </p>
                ) : null}
                <div className="mt-3 flex justify-end gap-2">
                  <Popover.Close asChild>
                    <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-gray-800/60 hover:text-white">
                      {t('mcava.cancel')}
                    </button>
                  </Popover.Close>
                  <button
                    type="submit"
                    disabled={busy || lookup.state !== 'found'}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-modrinth-green px-3 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" /> : null}
                    {t('mcava.apply')}
                  </button>
                </div>
              </form>
              <Popover.Arrow className="fill-[var(--bg-gradient-start)]" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  )
}
