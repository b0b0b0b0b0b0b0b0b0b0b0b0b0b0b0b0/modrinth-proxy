'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import { signInWithTelegram } from '@/lib/telegramPopup'

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
}
const NAMES = { github: 'GitHub', telegram: 'Telegram' }
const BUTTON =
  'inline-flex shrink-0 items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-40'
const LINK_BUTTON = `${BUTTON} border-transparent bg-modrinth-green font-bold text-black hover:opacity-90`
const UNLINK_BUTTON = `${BUTTON} border-gray-800 text-gray-400 hover:border-red-500/50 hover:text-red-400`

function Row({ icon, title, status, active, children }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${active ? 'border-modrinth-green/40 bg-modrinth-green/10 text-modrinth-green' : 'border-gray-800 text-gray-500'}`}
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
        <div className={`text-xs ${active ? 'text-modrinth-green' : 'text-gray-500'}`}>{status}</div>
      </div>
      {children}
    </li>
  )
}

export default function SignInMethods({ hasPassword, providers, takenProvider = null }) {
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
        <Row
          icon={ICONS.password}
          title={t('account.password')}
          status={t(hasPassword ? 'account.connPasswordSet' : 'account.connPasswordNone')}
          active={hasPassword}
        />
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
              ) : provider.id === 'github' ? (
                <a href="/api/auth/github" className={LINK_BUTTON}>
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
        <p className="mt-2 text-xs text-amber-400" role="alert">
          {error}
        </p>
      ) : !hasPassword && linkedCount === 1 ? (
        <p className="mt-2 text-xs text-gray-500">{t('account.connLast')}</p>
      ) : null}
    </div>
  )
}
