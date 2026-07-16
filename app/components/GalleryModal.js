'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function GalleryModal({
  image,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  neighborUrls = [],
}) {
  const [portalTarget, setPortalTarget] = useState(null)
  const [fullLoaded, setFullLoaded] = useState(false)
  const callbacksRef = useRef({ onClose, onPrev, onNext, hasPrev, hasNext })

  const fullSrc = image?.raw_url || image?.url || ''
  const thumbSrc = image?.url && image.url !== fullSrc ? image.url : null

  useEffect(() => {
    callbacksRef.current = { onClose, onPrev, onNext, hasPrev, hasNext }
  })

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  useEffect(() => {
    if (!fullSrc) return
    setFullLoaded(false)

    let cancelled = false
    const probe = new Image()
    probe.referrerPolicy = 'no-referrer'
    const markReady = () => {
      if (!cancelled) setFullLoaded(true)
    }
    probe.onload = markReady
    probe.onerror = markReady
    probe.src = fullSrc
    if (probe.complete && probe.naturalWidth > 0) markReady()

    return () => {
      cancelled = true
    }
  }, [fullSrc])

  useEffect(() => {
    neighborUrls.forEach((url) => {
      if (!url) return
      const preload = new Image()
      preload.referrerPolicy = 'no-referrer'
      preload.src = url
    })
  }, [neighborUrls])

  useEffect(() => {
    if (!portalTarget) return

    const handleKeyDown = (e) => {
      const { onClose: close, onPrev: prev, onNext: next, hasPrev: canPrev, hasNext: canNext } =
        callbacksRef.current
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft' && canPrev) prev()
      if (e.key === 'ArrowRight' && canNext) next()
    }

    let lastWheelAt = 0
    const handleWheel = (e) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastWheelAt < 250) return
      lastWheelAt = now
      const { onPrev: prev, onNext: next, hasPrev: canPrev, hasNext: canNext } = callbacksRef.current
      if (e.deltaY > 0 && canNext) next()
      else if (e.deltaY < 0 && canPrev) prev()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('wheel', handleWheel, { passive: false })
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('wheel', handleWheel)
      document.body.style.overflow = 'unset'
    }
  }, [portalTarget])

  if (!image || !portalTarget || !fullSrc) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/86 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="relative z-[221] flex max-h-[85vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {!fullLoaded &&
          (thumbSrc ? (
            <img
              src={thumbSrc}
              alt=""
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain opacity-60 blur-sm"
              referrerPolicy="no-referrer"
              aria-hidden
            />
          ) : (
            <div
              className="h-[min(70vh,420px)] w-[min(90vw,720px)] animate-pulse rounded-lg bg-white/10"
              aria-hidden
            />
          ))}

        <img
          key={fullSrc}
          src={fullSrc}
          alt={image.title || 'Gallery image'}
          className={`max-h-[85vh] max-w-[90vw] h-auto w-auto rounded-lg object-contain transition-opacity duration-200 ${
            fullLoaded ? 'opacity-100' : 'pointer-events-none absolute opacity-0'
          }`}
          onLoad={() => setFullLoaded(true)}
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="fixed bottom-8 left-1/2 z-[222] flex -translate-x-1/2 transform items-center gap-2 rounded-full bg-black/40 px-2 py-2 opacity-60 backdrop-blur-sm transition-all duration-200 hover:opacity-100">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:scale-110 hover:bg-white/20"
          aria-label="Закрыть"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <a
          href={fullSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:scale-110 hover:bg-white/20"
          aria-label="Открыть в новой вкладке"
          onClick={(e) => e.stopPropagation()}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
          </svg>
        </a>

        {hasPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:scale-110 hover:bg-white/20"
            aria-label="Предыдущее изображение"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="m12 19-7-7 7-7M19 12H5" />
            </svg>
          </button>
        )}

        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:scale-110 hover:bg-white/20"
            aria-label="Следующее изображение"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
