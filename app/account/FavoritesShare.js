'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'

const CODE_RE = /^mpfav1(\.[A-Za-z0-9]{6,12}){1,200}$/
const BUTTON =
  'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white disabled:opacity-60'
const ACTIVE = 'border-modrinth-green/50 text-white'

function Icon({ path }) {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d={path} />
    </svg>
  )
}

export default function FavoritesShare({ code, count }) {
  const t = useT()
  const router = useRouter()
  const [panel, setPanel] = useState(null)
  const [copied, setCopied] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ text: '', bad: false })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const share = () => {
    if (panel === 'share') {
      setPanel(null)
      return
    }
    setPanel('share')
    copy()
  }

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    const cleaned = value.replace(/\s+/g, '')
    if (!CODE_RE.test(cleaned)) {
      setMessage({ text: t('account.errImportCode'), bad: true })
      return
    }
    setBusy(true)
    setMessage({ text: '', bad: false })
    try {
      const response = await fetch('/api/account/favorites/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleaned }),
      })
      const data = await response.json().catch(() => null)
      if (response.ok && data) {
        setMessage({
          text: t('account.importResult', {
            added: Number(data.added) || 0,
            existing: Number(data.existing) || 0,
            missing: Number(data.missing) || 0,
          }),
          bad: false,
        })
        setValue('')
        router.refresh()
        return
      }
      const key =
        data?.error === 'bad_code' ? 'account.errImportCode' : data?.error === 'rate_limit' ? 'account.errRate' : 'account.errGeneric'
      setMessage({ text: t(key), bad: true })
    } catch {
      setMessage({ text: t('account.errGeneric'), bad: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-3">
      <div className="flex flex-wrap justify-end gap-2">
        {count > 0 ? (
          <button type="button" onClick={share} className={`${BUTTON} ${panel === 'share' ? ACTIVE : ''}`}>
            <Icon path="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
            {t('account.shareFavorites')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setPanel(panel === 'import' ? null : 'import')}
          className={`${BUTTON} ${panel === 'import' ? ACTIVE : ''}`}
        >
          <Icon path="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M8 11l4 4 4-4M12 15V2" />
          {t('account.importFavorites')}
        </button>
      </div>

      {panel === 'share' ? (
        <div className="mt-2 rounded-xl border border-gray-800 bg-[var(--bg-primary)] p-3">
          <div className="flex items-start gap-2">
            <code className="max-h-24 min-w-0 flex-1 select-all overflow-y-auto break-all text-xs leading-relaxed text-gray-300">{code}</code>
            <button type="button" onClick={copy} className={BUTTON}>
              {t(copied ? 'account.shareCopied' : 'account.shareCopy')}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{t('account.shareHint')}</p>
        </div>
      ) : null}

      {panel === 'import' ? (
        <form onSubmit={submit} className="mt-2 rounded-xl border border-gray-800 bg-[var(--bg-primary)] p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={t('account.importPlaceholder')}
              aria-label={t('account.importFavorites')}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={4000}
              className="min-w-0 flex-1 rounded-lg border border-gray-800 bg-modrinth-dark px-3 py-1.5 font-mono text-xs text-white outline-none transition-colors placeholder:text-gray-600 focus:border-modrinth-green"
            />
            <button
              type="submit"
              disabled={busy || !value.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-modrinth-green px-3 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" /> : null}
              {t('account.importSubmit')}
            </button>
          </div>
          <p className={`mt-2 text-[11px] leading-relaxed ${message.bad ? 'text-amber-400' : message.text ? 'text-modrinth-green' : 'text-gray-500'}`} role={message.bad ? 'alert' : undefined}>
            {message.text || t('account.importHint')}
          </p>
        </form>
      ) : null}
    </div>
  )
}
