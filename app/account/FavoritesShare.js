'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import { writeFavoritesCache } from '@/lib/favoritesCache'
import { buildFavoritesText, downloadText, favoritesFileName, readFavoritesFile } from '@/lib/favoritesFile'

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

const FILE_ERRORS = { type: 'account.errFileType', size: 'account.errFileSize', code: 'account.errFileCode' }

const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files')

export default function FavoritesShare({ code, count, name = '', titles = [] }) {
  const t = useT()
  const router = useRouter()
  const [panel, setPanel] = useState(null)
  const [copied, setCopied] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ text: '', bad: false })
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef(null)
  const dragDepth = useRef(0)

  useEffect(() => {
    writeFavoritesCache(code.split('.').slice(1))
  }, [code])

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

  const download = () => downloadText(favoritesFileName(name), buildFavoritesText(t, { name, code, titles }))

  const importFile = async (file) => {
    if (busy) return
    setPanel('import')
    const result = await readFavoritesFile(file)
    if (result.error) {
      setMessage({ text: t(FILE_ERRORS[result.error]), bad: true })
      return
    }
    setValue(result.code)
    importCode(result.code)
  }

  const dropProps = {
    onDragEnter: (event) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      dragDepth.current += 1
      setDragging(true)
      setPanel('import')
    },
    onDragOver: (event) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (event) => {
      if (!hasFiles(event)) return
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (dragDepth.current === 0) setDragging(false)
    },
    onDrop: (event) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      dragDepth.current = 0
      setDragging(false)
      importFile(event.dataTransfer.files?.[0])
    },
  }

  const submit = (event) => {
    event.preventDefault()
    importCode(value.replace(/\s+/g, ''))
  }

  const importCode = async (cleaned) => {
    if (busy) return
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
    <div className="mb-3" {...dropProps}>
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
            <div className="flex shrink-0 flex-col gap-1.5">
              <button type="button" onClick={copy} className={BUTTON}>
                <Icon path={copied ? 'M20 6 9 17l-5-5' : 'M8 8h11v13H8zM5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1'} />
                {t(copied ? 'account.shareCopied' : 'account.shareCopy')}
              </button>
              <button type="button" onClick={download} className={BUTTON}>
                <Icon path="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4M8 11l4 4 4-4M12 15V3" />
                {t('account.shareDownload')}
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-600 dark:text-gray-500">{t('account.shareHint')}</p>
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
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className={`mt-2 flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors disabled:opacity-60 ${
              dragging
                ? 'border-modrinth-green bg-modrinth-green/10 text-white'
                : 'border-gray-800 text-gray-500 hover:border-modrinth-green/50 hover:text-gray-300'
            }`}
          >
            <svg className={`h-6 w-6 transition-transform ${dragging ? '-translate-y-0.5 scale-110 text-modrinth-green' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z M14 3v5h5 M12 18v-6 M9 15l3-3 3 3" />
            </svg>
            <span className="text-xs font-semibold">{t(dragging ? 'account.importDropActive' : 'account.importDrop')}</span>
            <span className="text-[11px]">{t('account.importPick')}</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(event) => {
              importFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <p className={`mt-2 text-[11px] leading-relaxed ${message.bad ? 'text-amber-600 dark:text-amber-400' : message.text ? 'text-modrinth-green' : 'text-gray-600 dark:text-gray-500'}`} role={message.bad ? 'alert' : undefined}>
            {message.text || t('account.importHint')}
          </p>
        </form>
      ) : null}
    </div>
  )
}
