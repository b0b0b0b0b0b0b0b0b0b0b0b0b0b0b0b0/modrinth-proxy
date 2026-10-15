'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../components/I18nProvider'
import { ACCOUNT_UPDATES_KEY } from '../components/AccountUpdatesDot'
import { clearFavoritesCache } from '@/lib/favoritesCache'

const WAIT_SECONDS = 10
const WARNING_ICON = 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z'

function Modal({ title, onClose, children, closable }) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => {
      if (event.key === 'Escape' && closable) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [closable, onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => closable && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-modrinth-dark text-white shadow-2xl animate-fade-in-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-red-500/20 bg-red-500/10 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                <path d={WARNING_ICON} />
              </svg>
            </span>
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          {closable ? (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              aria-label="✕"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

const CANCEL_BUTTON =
  'inline-flex items-center justify-center rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold leading-none text-gray-200 transition-colors hover:border-gray-500 hover:text-white'
const DANGER_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-red-500 px-4 py-2.5 text-sm font-bold leading-none text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'

export default function DeleteAccount({ username, favorites, downloads, linkedNames }) {
  const t = useT()
  const [stage, setStage] = useState(null)
  const [seconds, setSeconds] = useState(WAIT_SECONDS)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (stage !== 'final' || seconds <= 0) return undefined
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [stage, seconds])

  const close = () => {
    setStage(null)
    setConfirmed(false)
    setSeconds(WAIT_SECONDS)
    setError('')
  }

  const openFinal = () => {
    setSeconds(WAIT_SECONDS)
    setConfirmed(false)
    setStage('final')
  }

  const remove = async () => {
    if (!confirmed || seconds > 0) return
    setStage('deleting')
    setError('')
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'delete-my-account' }),
      })
      if (!response.ok) throw new Error('failed')
      clearFavoritesCache()
      try {
        sessionStorage.removeItem(ACCOUNT_UPDATES_KEY)
      } catch {}
      setStage('done')
      setTimeout(() => window.location.replace('/'), 2000)
    } catch {
      setError(t('del.error'))
      setStage('final')
    }
  }

  const items = [
    t('del.itemAccount'),
    t('del.itemFavorites', { n: favorites }),
    t('del.itemHistory', { n: downloads }),
    t('del.itemUpdates'),
    ...(linkedNames.length ? [t('del.itemLinks', { list: linkedNames.join(', ') })] : []),
  ]

  return (
    <>
      <section className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-4">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-red-400">{t('del.title')}</h2>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="min-w-0 flex-1 basis-64 text-xs leading-relaxed text-gray-400">{t('del.lead')}</p>
          <button
            type="button"
            onClick={() => setStage('warn')}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-500/50 px-3 py-2 text-xs font-bold leading-none text-red-400 transition-colors hover:bg-red-500 hover:text-white"
          >
            {t('del.button')}
          </button>
        </div>
      </section>

      {stage === 'warn' ? (
        <Modal title={t('del.warnTitle', { name: username })} onClose={close} closable>
          <p className="text-sm text-gray-300">{t('del.warnIntro')}</p>
          <ul className="mt-3 space-y-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-gray-200">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            {t('del.warnTip')}
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={close} className={CANCEL_BUTTON} autoFocus>
              {t('del.warnCancel')}
            </button>
            <button type="button" onClick={openFinal} className={DANGER_BUTTON}>
              {t('del.warnNext')}
            </button>
          </div>
        </Modal>
      ) : null}

      {stage === 'final' || stage === 'deleting' || stage === 'done' ? (
        <Modal title={t('del.finalTitle')} onClose={close} closable={stage === 'final'}>
          {stage === 'done' ? (
            <p className="py-6 text-center text-sm text-gray-200">{t('del.done')}</p>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-gray-300">{t('del.finalText', { name: username })}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-red-500 transition-[width] duration-1000 ease-linear"
                  style={{ width: `${((WAIT_SECONDS - seconds) / WAIT_SECONDS) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-500">
                {seconds > 0 ? t('del.finalWait', { s: seconds }) : t('del.finalReady')}
              </p>
              <label
                className={`mt-4 flex items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${
                  seconds > 0
                    ? 'cursor-not-allowed border-gray-800 text-gray-900 opacity-50 dark:text-gray-100'
                    : 'cursor-pointer border-red-500/40 text-gray-900 hover:bg-red-500/5 dark:text-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={seconds > 0 || stage === 'deleting'}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-red-500"
                />
                <span>{t('del.finalCheck')}</span>
              </label>
              {error ? (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={close} disabled={stage === 'deleting'} className={CANCEL_BUTTON} autoFocus>
                  {t('del.warnCancel')}
                </button>
                <button
                  type="button"
                  onClick={remove}
                  disabled={!confirmed || seconds > 0 || stage === 'deleting'}
                  className={DANGER_BUTTON}
                >
                  {stage === 'deleting' ? (
                    <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : null}
                  {t(stage === 'deleting' ? 'del.deleting' : 'del.finalDelete')}
                </button>
              </div>
            </>
          )}
        </Modal>
      ) : null}
    </>
  )
}
