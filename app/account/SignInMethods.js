'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import StyledTooltip from '../components/StyledTooltip'
import { signInWithTelegram } from '@/lib/telegramPopup'
import PasswordInput, { PasswordStrength } from '../components/PasswordInput'

const ICONS = {
  password: {
    stroke: true,
    path: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z',
  },
  github: {
    path: 'M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z',
  },
  telegram: {
    path: 'M21.94 4.3 18.6 20.05c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.15 9.37-8.47c.4-.36-.09-.56-.63-.2L5.78 13.5.8 11.95c-1.08-.34-1.1-1.08.23-1.6L20.5 2.84c.9-.33 1.69.21 1.44 1.46Z',
  },
  discord: {
    path: 'M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.27 18.27 0 0 0-5.49 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.88 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-1.99a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6.01-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.09-2.15-2.42s.95-2.42 2.15-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42Z',
  },
}
const NAMES = { github: 'GitHub', telegram: 'Telegram', discord: 'Discord' }
const BUTTON =
  'inline-flex shrink-0 items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-40'
const LINK_BUTTON = `${BUTTON} border-transparent bg-modrinth-green font-bold text-black hover:opacity-90`
const UNLINK_BUTTON = `${BUTTON} border-gray-800 text-gray-400 hover:border-red-500/50 hover:text-red-400`

function Row({ icon, title, status, active, children }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${active ? 'border-modrinth-green/40 bg-modrinth-green/10 text-modrinth-green' : 'border-gray-800 text-gray-600 dark:text-gray-500'}`}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          aria-hidden
          {...(icon.stroke
            ? { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
            : { fill: 'currentColor' })}
        >
          <path d={icon.path} />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className={`text-xs ${active ? 'text-modrinth-green' : 'text-gray-600 dark:text-gray-500'}`}>{status}</div>
      </div>
      {children}
    </li>
  )
}

const PASSWORD_ERRORS = {
  current: 'account.errCurrentPassword',
  password: 'account.errPassword',
  rate_limit: 'account.errRate',
}
const SMALL_BUTTON =
  'inline-flex shrink-0 items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold leading-none transition-colors disabled:opacity-50'

function blockCopy(event) {
  event.preventDefault()
}

function isAutofilled(input) {
  for (const selector of [':autofill', ':-webkit-autofill']) {
    try {
      if (input.matches(selector)) return true
    } catch {}
  }
  return false
}

function filledBySoftware(event) {
  const type = event.nativeEvent?.inputType
  return isAutofilled(event.target) || ((!type || type === 'insertReplacementText') && event.target.value.length > 1)
}

function PasswordRow({ hasPassword, username, onSaved }) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ text: '', ok: false })
  const label = t(hasPassword ? 'account.changePassword' : 'account.setPassword')

  const close = () => {
    setEditing(false)
    setCurrent('')
    setNext('')
    setRepeat('')
    setConfirming(false)
    setGenerated(false)
    setVisible(false)
  }

  const open = () => {
    setMessage({ text: '', ok: false })
    setEditing(true)
  }

  const save = async (event) => {
    event.preventDefault()
    if (busy) return
    if (next.length < 8 || next.length > 128) {
      setMessage({ text: t('account.errPassword'), ok: false })
      return
    }
    const trusted = generated || isAutofilled(event.currentTarget.querySelector('input[autocomplete="new-password"]'))
    if (!confirming && !trusted) {
      setMessage({ text: '', ok: false })
      setConfirming(true)
      return
    }
    if (!trusted && repeat !== next) {
      setRepeat('')
      setMessage({ text: t('account.errPasswordMismatch'), ok: false, keep: true })
      return
    }
    setBusy(true)
    setMessage({ text: '', ok: false })
    try {
      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next }),
      })
      if (response.ok) {
        close()
        setMessage({ text: t('account.passwordSaved'), ok: true })
        onSaved()
        return
      }
      const data = await response.json().catch(() => null)
      const key = Object.hasOwn(PASSWORD_ERRORS, data?.error) ? PASSWORD_ERRORS[data.error] : 'account.errGeneric'
      setMessage({ text: t(key), ok: false })
    } catch {
      setMessage({ text: t('account.errGeneric'), ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Row
        icon={ICONS.password}
        title={t('account.password')}
        status={t(hasPassword ? 'account.connPasswordSet' : 'account.connPasswordNone')}
        active={hasPassword}
      >
        {!editing ? (
          <StyledTooltip label={label}>
            <button
              type="button"
              onClick={open}
              aria-label={label}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-800 text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </StyledTooltip>
        ) : null}
      </Row>
      {editing ? (
        <li className="pb-3">
          <form
            onSubmit={save}
            onKeyDown={(event) => {
              if (event.key === 'Escape') close()
            }}
            className="max-w-md space-y-4 pb-1 sm:ml-13"
          >
            <input type="text" name="username" autoComplete="username" hidden readOnly value={username || ''} />
            {hasPassword ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-400">{t('account.currentPassword')}</span>
                <PasswordInput
                  visible={visible}
                  onToggleVisible={() => setVisible((value) => !value)}
                  inputProps={{
                    value: current,
                    onChange: (event) => setCurrent(event.target.value),
                    placeholder: t('account.passwordPlaceholder'),
                    autoComplete: 'current-password',
                    autoFocus: true,
                    maxLength: 256,
                    required: true,
                  }}
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-400">{t('account.newPassword')}</span>
              <PasswordInput
                visible={visible}
                onToggleVisible={() => setVisible((value) => !value)}
                inputProps={{
                  value: next,
                  onChange: (event) => {
                    setNext(event.target.value)
                    setGenerated(filledBySoftware(event))
                    if (repeat) setRepeat('')
                  },
                  onCopy: blockCopy,
                  onCut: blockCopy,
                  onDragStart: blockCopy,
                  onDrop: blockCopy,
                  placeholder: t('account.newPasswordPlaceholder'),
                  autoComplete: 'new-password',
                  autoFocus: !hasPassword,
                  maxLength: 128,
                  required: true,
                }}
              />
              <PasswordStrength password={next} />
            </label>
            {confirming ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-400">{t('account.repeatPassword')}</span>
                <PasswordInput
                  visible={visible}
                  onToggleVisible={() => setVisible((value) => !value)}
                  inputProps={{
                    value: repeat,
                    onChange: (event) => setRepeat(event.target.value),
                    onCopy: blockCopy,
                    onCut: blockCopy,
                    onDragStart: blockCopy,
                    onDrop: blockCopy,
                    placeholder: t('account.repeatPasswordPlaceholder'),
                    autoComplete: 'new-password',
                    autoFocus: true,
                    maxLength: 128,
                    required: true,
                  }}
                />
                <span className="mt-1.5 block text-[11px] text-gray-600 dark:text-gray-500">{t('account.repeatPasswordHint')}</span>
              </label>
            ) : null}
            {message.text && !message.ok ? (
              <div role="alert">
                <p className="m-0 text-xs text-amber-600 dark:text-amber-400">{message.text}</p>
                {message.keep ? (
                  <p className="m-0 mt-1 text-xs text-gray-500 dark:text-gray-400">{t('account.passwordKeptHint')}</p>
                ) : null}
              </div>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={close} className={`${SMALL_BUTTON} border-gray-700 text-gray-300 hover:text-white`}>
                {t('account.cancelUsername')}
              </button>
              <button
                type="submit"
                disabled={busy || !next || (hasPassword && !current) || (confirming && !repeat)}
                className={`${SMALL_BUTTON} border-transparent bg-modrinth-green font-bold text-black hover:opacity-90`}
              >
                {t('account.saveUsername')}
              </button>
            </div>
          </form>
        </li>
      ) : message.ok ? (
        <li className="pb-3 text-xs text-modrinth-green">{message.text}</li>
      ) : null}
    </>
  )
}

export default function SignInMethods({ hasPassword, username, providers, takenProvider = null }) {
  const t = useT()
  const router = useRouter()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(
    takenProvider && NAMES[takenProvider] ? t(`account.${takenProvider}Taken`) : '',
  )

  const linkedCount = providers.filter((provider) => provider.linked).length

  const unlink = async (id) => {
    if (busy) return
    setBusy(id)
    setError('')
    try {
      const response = await fetch('/api/account/external', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: id }),
      })
      if (response.ok) router.refresh()
      else {
        const data = await response.json().catch(() => null)
        setError(t(data?.error === 'last' ? 'account.connLast' : 'account.errGeneric'))
      }
    } catch {
      setError(t('account.errGeneric'))
    } finally {
      setBusy(null)
    }
  }

  const linkTelegram = async (botId) => {
    if (busy) return
    setBusy('telegram')
    setError('')
    const outcome = await signInWithTelegram(botId, null)
    setBusy(null)
    if (outcome.result === 'linked' || outcome.result === 'session') router.refresh()
    else if (outcome.result === 'error') {
      setError(t(outcome.error === 'taken' ? 'account.telegramTaken' : 'account.errTelegram'))
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-400">{t('account.connLead')}</p>
      <ul className="mt-2 divide-y divide-gray-800">
        <PasswordRow hasPassword={hasPassword} username={username} onSaved={() => router.refresh()} />
        {providers.map((provider) => {
          const onlyWay = provider.linked && !hasPassword && linkedCount === 1
          return (
            <Row
              key={provider.id}
              icon={ICONS[provider.id]}
              title={NAMES[provider.id]}
              status={t(provider.linked ? 'account.connLinked' : 'account.connNotLinked')}
              active={provider.linked}
            >
              {provider.linked ? (
                <button
                  type="button"
                  onClick={() => unlink(provider.id)}
                  disabled={Boolean(busy) || onlyWay}
                  className={UNLINK_BUTTON}
                >
                  {t('account.connUnlink')}
                </button>
              ) : provider.id === 'github' || provider.id === 'discord' ? (
                <a href={`/api/auth/${provider.id}`} className={LINK_BUTTON}>
                  {t('account.connLink')}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => linkTelegram(provider.botId)}
                  disabled={Boolean(busy)}
                  className={LINK_BUTTON}
                >
                  {t('account.connLink')}
                </button>
              )}
            </Row>
          )
        })}
      </ul>
      {error ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400" role="alert">
          {error}
        </p>
      ) : !hasPassword && linkedCount === 1 ? (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-500">{t('account.connLast')}</p>
      ) : null}
    </div>
  )
}
