'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import { signInWithTelegram } from '@/lib/telegramPopup'
import DeleteAccount from './DeleteAccount'

const LINK_BUTTON =
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-modrinth-green px-2.5 py-1.5 text-xs font-bold leading-none text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'
const GHOST_BUTTON =
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-800 px-2.5 py-1.5 text-xs font-semibold leading-none text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white disabled:opacity-50'

function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? 'bg-modrinth-green' : 'bg-gray-700'}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  )
}

function Setting({ title, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{title}</div>
        {hint ? <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-500">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-800 bg-[var(--bg-primary)] px-4 py-1">
      <h2 className="pt-3 text-[11px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">{title}</h2>
      <div className="divide-y divide-gray-800">{children}</div>
    </section>
  )
}

export default function AccountSettings({
  telegram,
  trackDownloads: initialTrack,
  recordHistory: initialRecord,
  mutedCount,
  deletion,
}) {
  const t = useT()
  const router = useRouter()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [notify, setNotify] = useState(telegram.notify)
  const [trackDownloads, setTrackDownloads] = useState(initialTrack)
  const [recordHistory, setRecordHistory] = useState(initialRecord)

  const save = async (key, payload, apply, revert) => {
    if (busy) return
    setBusy(key)
    setError('')
    apply()
    try {
      const response = await fetch('/api/account/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        revert()
        setError(t('account.errGeneric'))
        return false
      }
      return true
    } catch {
      revert()
      setError(t('account.errGeneric'))
      return false
    } finally {
      setBusy(null)
    }
  }

  const linkTelegram = async () => {
    if (busy) return
    setBusy('link')
    setError('')
    const outcome = await signInWithTelegram(telegram.botId, null)
    setBusy(null)
    if (outcome.result === 'linked' || outcome.result === 'session') router.refresh()
    else if (outcome.result === 'error') {
      setError(t(outcome.error === 'taken' ? 'account.telegramTaken' : 'account.errTelegram'))
    }
  }

  return (
    <div className="space-y-3">
      {telegram.botId ? (
        <Section title="Telegram">
          <Setting title={t('tg.notifyTitle')} hint={t(telegram.linked ? 'tg.notifyHint' : 'tg.notifyNeedLink')}>
            {telegram.linked ? (
              <Switch
                checked={notify}
                label={t('tg.notifyTitle')}
                disabled={Boolean(busy)}
                onChange={() =>
                  save('notify', { telegram: !notify }, () => setNotify(!notify), () => setNotify(notify))
                }
              />
            ) : (
              <button type="button" onClick={linkTelegram} disabled={Boolean(busy)} className={LINK_BUTTON}>
                {t('account.telegramLink')}
              </button>
            )}
          </Setting>
        </Section>
      ) : null}

      <Section title={t('account.updates')}>
        <Setting title={t('set.trackDownloads')} hint={t('set.trackDownloadsHint')}>
          <Switch
            checked={trackDownloads}
            label={t('set.trackDownloads')}
            disabled={Boolean(busy)}
            onChange={() =>
              save(
                'track',
                { trackDownloads: !trackDownloads },
                () => setTrackDownloads(!trackDownloads),
                () => setTrackDownloads(trackDownloads),
              ).then((ok) => ok && router.refresh())
            }
          />
        </Setting>
        {mutedCount > 0 ? (
          <Setting title={t('set.mutedTitle', { n: mutedCount })} hint={t('set.mutedHint')}>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => save('unmute', { unmuteAll: true }, () => {}, () => {}).then((ok) => ok && router.refresh())}
              className={GHOST_BUTTON}
            >
              {t('set.unmuteAll')}
            </button>
          </Setting>
        ) : null}
      </Section>

      <Section title={t('account.downloads')}>
        <Setting title={t('set.recordHistory')} hint={t('set.recordHistoryHint')}>
          <Switch
            checked={recordHistory}
            label={t('set.recordHistory')}
            disabled={Boolean(busy)}
            onChange={() =>
              save(
                'record',
                { recordHistory: !recordHistory },
                () => setRecordHistory(!recordHistory),
                () => setRecordHistory(recordHistory),
              )
            }
          />
        </Setting>
      </Section>

      {error ? (
        <p className="text-xs text-amber-600 dark:text-amber-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="pt-6">
        <DeleteAccount {...deletion} />
      </div>
    </div>
  )
}
