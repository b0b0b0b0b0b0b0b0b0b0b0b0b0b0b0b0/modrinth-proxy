'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import StyledTooltip from '../components/StyledTooltip'

const USERNAME_RE = /^[A-Za-z0-9_]{3,24}$/
const ERROR_KEYS = {
  taken: 'account.errTaken',
  username: 'account.errUsername',
  rate_limit: 'account.errRate',
}
const ICON_BUTTON =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-800 text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white disabled:opacity-50'

function Icon({ path }) {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d={path} />
    </svg>
  )
}

export default function UsernameEditor({ username, heading: Heading = 'h1' }) {
  const t = useT()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(username)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const open = () => {
    setValue(username)
    setError('')
    setEditing(true)
  }

  const save = async (event) => {
    event.preventDefault()
    if (busy) return
    const next = value.trim()
    if (next === username) {
      setEditing(false)
      return
    }
    if (!USERNAME_RE.test(next)) {
      setError(t('account.errUsername'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/account/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: next }),
      })
      if (response.ok) {
        setEditing(false)
        router.refresh()
        return
      }
      const data = await response.json().catch(() => null)
      setError(t(Object.hasOwn(ERROR_KEYS, data?.error) ? ERROR_KEYS[data.error] : 'account.errGeneric'))
    } catch {
      setError(t('account.errGeneric'))
    } finally {
      setBusy(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <Heading className="truncate text-2xl font-bold text-white">{t('account.hello', { name: username })}</Heading>
        <StyledTooltip label={t('account.editUsername')}>
          <button type="button" onClick={open} aria-label={t('account.editUsername')} className={ICON_BUTTON}>
            <Icon path="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </button>
        </StyledTooltip>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="min-w-0">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setEditing(false)
          }}
          aria-label={t('account.username')}
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={24}
          className="w-56 max-w-full rounded-lg border border-gray-800 bg-[var(--bg-primary)] px-3 py-1.5 text-lg font-bold text-white outline-none transition-colors focus:border-modrinth-green"
        />
        <StyledTooltip label={t('account.saveUsername')}>
          <button type="submit" disabled={busy} aria-label={t('account.saveUsername')} className={ICON_BUTTON}>
            <Icon path="m4.5 12.75 6 6 9-13.5" />
          </button>
        </StyledTooltip>
        <StyledTooltip label={t('account.cancelUsername')}>
          <button type="button" onClick={() => setEditing(false)} disabled={busy} aria-label={t('account.cancelUsername')} className={ICON_BUTTON}>
            <Icon path="M6 6l12 12M18 6 6 18" />
          </button>
        </StyledTooltip>
      </div>
      <p className={`mt-1.5 text-xs ${error ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-500'}`} role={error ? 'alert' : undefined}>
        {error || t('account.usernameHint')}
      </p>
    </form>
  )
}
