'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import { writeFavoritesCache } from '@/lib/favoritesCache'
import { buildFavoritesText, downloadText, favoritesFileName, favoritesLink, readFavoritesFile } from '@/lib/favoritesFile'

const CODE_RE = /^mpfav1(\.[A-Za-z0-9]{6,12}){1,200}$/
const BUTTON =
  'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white disabled:opacity-60'
const ACTIVE = 'border-modrinth-green/50 text-white'
const PRIMARY =
  'inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-modrinth-green px-3 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40'
const FILE_ERRORS = { type: 'account.errFileType', size: 'account.errFileSize', code: 'account.errFileCode' }
const ICONS = {
  share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
  paste: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M8 11l4 4 4-4M12 15V2',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  copy: 'M8 8h11v13H8zM5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1',
  done: 'M20 6 9 17l-5-5',
  download: 'M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4M8 11l4 4 4-4M12 15V3',
  more: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  telegram: 'M21.5 4.5 2.8 11.7c-.9.4-.9 1.3 0 1.6l4.7 1.5 1.8 5.6c.2.7 1 .9 1.5.4l2.6-2.4 4.9 3.6c.6.4 1.4.1 1.6-.7L22.9 5.8c.2-1-.5-1.6-1.4-1.3ZM8 14.6l9.3-6.9',
  whatsapp: 'M3.5 20.5 4.8 16A8.5 8.5 0 1 1 8 19.3ZM9 8.5c0 3.3 2.7 6.5 6.5 6.5l1-1.5-2-1-1 1c-1-.4-2.1-1.5-2.5-2.5l1-1-1-2Z',
}

function Icon({ name }) {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  )
}

const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files')

function useFlag() {
  const [on, setOn] = useState(false)
  const timer = useRef(null)
  const flash = () => {
    clearTimeout(timer.current)
    setOn(true)
    timer.current = setTimeout(() => setOn(false), 2000)
  }
  return [on, flash]
}

export default function FavoritesShare({ code, count, titles = [], sharedCode = '' }) {
  const t = useT()
  const router = useRouter()
  const [panel, setPanel] = useState(null)
  const [linkCopied, flashLink] = useFlag()
  const [codeCopied, flashCode] = useFlag()
  const [showCode, setShowCode] = useState(false)
  const [link, setLink] = useState('')
  const [longLink, setLongLink] = useState('')
  const [canShare, setCanShare] = useState(false)
  const shortFor = useRef({ code: '', url: '' })
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ text: '', bad: false })
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef(null)
  const dragDepth = useRef(0)

  useEffect(() => {
    writeFavoritesCache(code.split('.').slice(1))
    setLongLink(favoritesLink(window.location.origin, code))
    setLink(shortFor.current.code === code ? shortFor.current.url : '')
  }, [code])

  useEffect(() => {
    setCanShare(typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    if (!sharedCode) return
    setPanel('import')
    setValue(sharedCode)
    setMessage({ text: t('account.sharedListReady', { n: sharedCode.split('.').length - 1 }), bad: false })
  }, [sharedCode])

  const shareText = t('account.shareText')

  const copyText = async (text, flash) => {
    try {
      await navigator.clipboard.writeText(text)
      flash()
    } catch {}
  }

  const ensureLink = async () => {
    if (shortFor.current.code === code && shortFor.current.url) return shortFor.current.url
    let url = favoritesLink(window.location.origin, code)
    try {
      const response = await fetch('/api/account/favorites/link', { method: 'POST' })
      const data = await response.json().catch(() => null)
      if (response.ok && typeof data?.id === 'string' && /^[0-9A-Za-z]{7,12}$/.test(data.id)) {
        url = `${window.location.origin}/l/${data.id}`
        shortFor.current = { code, url }
      }
    } catch {}
    setLink(url)
    return url
  }

  const toggleShare = async () => {
    if (panel === 'share') {
      setPanel(null)
      return
    }
    setPanel('share')
    const url = await ensureLink()
    copyText(url, flashLink)
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: t('account.shareTitle'), text: shareText, url: link })
    } catch {}
  }

  const openShare = (url) => window.open(url, '_blank', 'noopener,noreferrer')

  const download = () => downloadText(favoritesFileName(''), buildFavoritesText(t, { code, link: link || longLink, titles }))

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
        if (sharedCode) router.replace('/account?tab=favorites', { scroll: false })
        else router.refresh()
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
          <button type="button" onClick={toggleShare} className={`${BUTTON} ${panel === 'share' ? ACTIVE : ''}`}>
            <Icon name="share" />
            {t('account.shareFavorites')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setPanel(panel === 'import' ? null : 'import')}
          className={`${BUTTON} ${panel === 'import' ? ACTIVE : ''}`}
        >
          <Icon name="paste" />
          {t('account.importFavorites')}
        </button>
      </div>

      {panel === 'share' ? (
        <div className="mt-2 rounded-xl border border-gray-800 bg-[var(--bg-primary)] p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={link}
              placeholder={t('account.shareLinkLoading')}
              aria-label={t('account.shareLink')}
              onFocus={(event) => event.target.select()}
              className="min-w-0 flex-1 rounded-lg border border-gray-800 bg-modrinth-dark px-3 py-1.5 font-mono text-xs text-gray-300 outline-none focus:border-modrinth-green"
            />
            <button type="button" onClick={() => copyText(link, flashLink)} disabled={!link} className={PRIMARY}>
              <Icon name={linkCopied ? 'done' : 'link'} />
              {t(linkCopied ? 'account.shareCopied' : 'account.shareCopyLink')}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!link}
              onClick={() => openShare(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`)}
              className={`${BUTTON} hover:!border-[#29a9eb]/60 hover:!text-[#29a9eb]`}
            >
              <Icon name="telegram" />
              Telegram
            </button>
            <button
              type="button"
              disabled={!link}
              onClick={() => openShare(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${link}`)}`)}
              className={`${BUTTON} hover:!border-[#25d366]/60 hover:!text-[#25d366]`}
            >
              <Icon name="whatsapp" />
              WhatsApp
            </button>
            {canShare ? (
              <button type="button" disabled={!link} onClick={nativeShare} className={BUTTON}>
                <Icon name="more" />
                {t('account.shareMore')}
              </button>
            ) : null}
            <button type="button" onClick={download} className={BUTTON}>
              <Icon name="download" />
              {t('account.shareDownload')}
            </button>
            <button type="button" onClick={() => setShowCode(!showCode)} className={`${BUTTON} ${showCode ? ACTIVE : ''}`}>
              {t('account.shareShowCode')}
            </button>
          </div>

          {showCode ? (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-gray-800 p-2">
              <code className="max-h-24 min-w-0 flex-1 select-all overflow-y-auto break-all text-xs leading-relaxed text-gray-300">{code}</code>
              <button type="button" onClick={() => copyText(code, flashCode)} className={BUTTON}>
                <Icon name={codeCopied ? 'done' : 'copy'} />
                {t(codeCopied ? 'account.shareCopied' : 'account.shareCopy')}
              </button>
            </div>
          ) : null}

          <p className="mt-2 text-[11px] leading-relaxed text-gray-600 dark:text-gray-500">{t('account.shareHint')}</p>
        </div>
      ) : null}

      {panel === 'import' ? (
        <form
          onSubmit={submit}
          className={`mt-2 rounded-xl border bg-[var(--bg-primary)] p-3 ${sharedCode && value ? 'border-modrinth-green/50' : 'border-gray-800'}`}
        >
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
            <button type="submit" disabled={busy || !value.trim()} className={PRIMARY}>
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
