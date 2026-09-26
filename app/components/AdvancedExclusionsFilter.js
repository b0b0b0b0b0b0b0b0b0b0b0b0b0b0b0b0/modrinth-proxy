'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useT } from './I18nProvider'
import { labeled } from '@/lib/i18n/label'
import {
  EPILEPSY_EXCLUSION_ID,
  appendDisclosureExclusionParams,
  ackEpilepsyExclusion,
  clearEpilepsyExclusionAck,
  disclosureTreeForCatalog,
  filterDisclosureIdsForCatalog,
  hideEpilepsyExclusionWarning,
  parseDisclosureExclusions,
  saveVisibleDisclosureExclusions,
  shouldSkipEpilepsyWarning,
  toggleDisclosureExclusion,
} from '@/lib/disclosureExclusions'

function BanIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  )
}

function Chevron({ open }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
    </svg>
  )
}

function ItemIcon({ id }) {
  const className = 'h-4 w-4'
  if (id === 'ai_content') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className={className}>
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0zM20 3v4M22 5h-4M4 17v2M5 18H3" />
      </svg>
    )
  }
  if (id === 'ai_functionality') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className={className}>
        <path d="m10.852 14.772-.383.923M10.852 9.228l-.383-.923M13.148 14.772l.382.924M13.531 8.305l-.383.923M14.772 10.852l.923-.383M14.772 13.148l.923.383M17.598 6.5A3 3 0 1 0 12 5a3 3 0 0 0-5.63-1.446 3 3 0 0 0-.368 1.571 4 4 0 0 0-2.525 5.771" />
        <path d="M17.998 5.125a4 4 0 0 1 2.525 5.771" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  if (id === 'advertisements') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className={className}>
        <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
        <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14M8 6v8" />
      </svg>
    )
  }
  if (id === 'epilepsy_triggers') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className={className}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  if (id === 'system_interactions') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className={className}>
        <path d="M12 17v4M8 21h8M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
        <circle cx="18" cy="6" r="3" />
      </svg>
    )
  }
  if (id === 'telemetry') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className={className}>
        <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9M7.8 4.7a6.14 6.14 0 0 0-.8 7.5" />
        <circle cx="12" cy="9" r="2" />
        <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47M19.1 1.9a9.96 9.96 0 0 1 0 14.1M9.5 18h5M8 22l4-11 4 11" />
      </svg>
    )
  }
  if (id === 'paid_features') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 18V6" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className={className}>
      <rect width="20" height="5" x="2" y="4" rx="2" />
      <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9M10 13h4" />
    </svg>
  )
}

function isItemActive(selected, item) {
  return selected.includes(item.id)
}

function PhotosensitivityWarningModal({ open, onConfirm }) {
  const t = useT()
  const [portalTarget, setPortalTarget] = useState(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  useEffect(() => {
    if (open) setDontShowAgain(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open || !portalTarget) return null

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="epilepsy-warning-title"
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-700 bg-modrinth-dark text-white shadow-2xl"
      >
        <div className="border-b border-gray-700 p-6">
          <h2 id="epilepsy-warning-title" className="m-0 text-2xl font-semibold">
            {t('disc.warnTitle')}
          </h2>
        </div>
        <div className="flex flex-col p-6">
          <p className="mb-4 mt-0 leading-normal text-gray-300">
            {t('disc.warn1')}
          </p>
          <p className="mb-4 mt-0 leading-normal text-gray-300">
            {t('disc.warn2')}
          </p>
          <p className="mb-4 mt-0 leading-normal text-gray-300">
            {t('disc.warn3')}
          </p>
          <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
            <button
              type="button"
              role="checkbox"
              aria-checked={dontShowAgain}
              aria-label={t('disc.dontShow')}
              onClick={() => setDontShowAgain((value) => !value)}
              className="flex items-center gap-3 bg-transparent p-0 text-left text-sm font-medium text-gray-200"
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                dontShowAgain
                  ? 'border-modrinth-green bg-modrinth-green text-black'
                  : 'border-gray-600 bg-gray-800'
              }`}>
                {dontShowAgain && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {t('disc.dontShow')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (dontShowAgain) hideEpilepsyExclusionWarning()
                onConfirm()
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-modrinth-green px-2.5 text-base font-semibold text-black"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              {t('disc.ok')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}

function ExclusionRow({ item, selected, onToggle, nested = false }) {
  const t = useT()
  const active = isItemActive(selected, item)
  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      className={`group flex w-full min-w-0 items-center gap-2 truncate rounded-xl px-2 py-1.5 text-left text-sm font-semibold transition-all ${
        active
          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
          : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
      } ${nested ? '' : ''}`}
    >
      {!nested && (
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
          <ItemIcon id={item.id} />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{labeled(t, `disc.${item.id}`, item.label)}</span>
      <span className={`ml-auto ${active ? 'opacity-100 text-red-400' : 'opacity-0 text-red-400 group-hover:opacity-100'}`}>
        <BanIcon />
      </span>
    </button>
  )
}

export default function AdvancedExclusionsFilter() {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hydrated = useRef(false)
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState({})
  const urlIds = parseDisclosureExclusions(searchParams)
  const selected = filterDisclosureIdsForCatalog(urlIds, pathname)
  const tree = disclosureTreeForCatalog(pathname)
  const queryString = searchParams.toString()
  const [warningOpen, setWarningOpen] = useState(false)
  const [pendingIds, setPendingIds] = useState(null)

  const pushIds = (ids) => {
    const visible = filterDisclosureIdsForCatalog(ids, pathname)
    const params = new URLSearchParams(queryString)
    params.delete('a')
    params.delete('page')
    appendDisclosureExclusionParams(params, visible, pathname)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const applyIds = (ids) => {
    const visible = filterDisclosureIdsForCatalog(ids, pathname)
    saveVisibleDisclosureExclusions(visible, pathname)
    pushIds(visible)
  }

  const requestIds = (ids) => {
    const turningOnEpilepsy =
      ids.includes(EPILEPSY_EXCLUSION_ID) && !selected.includes(EPILEPSY_EXCLUSION_ID)
    if (turningOnEpilepsy && !shouldSkipEpilepsyWarning()) {
      setPendingIds(ids)
      setWarningOpen(true)
      return
    }
    applyIds(ids)
  }

  const confirmWarning = () => {
    const ids = pendingIds
    ackEpilepsyExclusion()
    setWarningOpen(false)
    setPendingIds(null)
    if (ids) applyIds(ids)
  }

  useEffect(() => {
    const urlIds = parseDisclosureExclusions(searchParams)
    const visible = filterDisclosureIdsForCatalog(urlIds, pathname)
    if (urlIds.length !== visible.length) {
      pushIds(visible)
      return
    }
    if (!hydrated.current) {
      hydrated.current = true
      if (urlIds.length > 0) {
        if (urlIds.includes(EPILEPSY_EXCLUSION_ID) && !shouldSkipEpilepsyWarning()) {
          const withoutEpilepsy = urlIds.filter((id) => id !== EPILEPSY_EXCLUSION_ID)
          setPendingIds(urlIds)
          setWarningOpen(true)
          pushIds(withoutEpilepsy)
          return
        }
        return
      }
      return
    }
    if (!urlIds.includes(EPILEPSY_EXCLUSION_ID) && !warningOpen) {
      clearEpilepsyExclusionAck()
    }
  }, [queryString, pathname])

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-modrinth-dark">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <h3 className="m-0 flex-1 text-sm font-semibold text-gray-300">{t('filter.advanced')}</h3>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="px-3 pb-3">
          <div className="mb-2 flex gap-2 px-1 text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>{t('disc.excludeHint')}</span>
          </div>
          <div className="flex flex-col gap-1">
            {tree.map((item) => {
              const hasChildren = Boolean(item.children?.length)
              const childrenOpen = expanded[item.id]
              return (
                <div key={item.id}>
                  <div className="flex items-center gap-1">
                    <ExclusionRow item={item} selected={selected} onToggle={(id) => requestIds(toggleDisclosureExclusion(selected, id))} />
                    {hasChildren && (
                      <button
                        type="button"
                        aria-label={childrenOpen ? t('disc.hide') : t('disc.show')}
                        onClick={() => setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className="rounded-xl px-2 py-1 text-gray-500 hover:bg-gray-800 hover:text-white"
                      >
                        <Chevron open={childrenOpen} />
                      </button>
                    )}
                  </div>
                  {hasChildren && childrenOpen && (
                    <div className="ml-4 flex flex-col gap-1">
                      {item.children.map((child) => (
                        <ExclusionRow
                          key={child.id}
                          item={child}
                          nested
                          selected={selected}
                          onToggle={(id) => requestIds(toggleDisclosureExclusion(selected, id))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      <PhotosensitivityWarningModal open={warningOpen} onConfirm={confirmWarning} />
    </div>
  )
}
