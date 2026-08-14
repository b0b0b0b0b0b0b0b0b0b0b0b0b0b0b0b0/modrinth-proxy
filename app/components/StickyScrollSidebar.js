'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const TOP_OFFSET = 16
const BOTTOM_OFFSET = 20
const FOOTER_GAP = 16

function getFooterTop() {
  const footer = document.querySelector('footer')
  return footer?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
}

export default function StickyScrollSidebar({ children, className = '' }) {
  const rootRef = useRef(null)
  const scrollRef = useRef(null)
  const trackRef = useRef(null)
  const rafRef = useRef(0)
  const maxHeightRef = useRef(null)
  const [fade, setFade] = useState({ top: false, bottom: false, active: false })
  const [engaged, setEngaged] = useState(false)
  const [showTrack, setShowTrack] = useState(false)

  const updateFade = useCallback((scroller, overflow) => {
    const next = overflow
      ? {
          active: true,
          top: scroller.scrollTop > 6,
          bottom: scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 6,
        }
      : { top: false, bottom: false, active: false }

    setFade((prev) =>
      prev.active === next.active && prev.top === next.top && prev.bottom === next.bottom ? prev : next,
    )
  }, [])

  const updateTrack = useCallback((scroller, overflow) => {
    const track = trackRef.current
    if (!track) return

    setShowTrack((prev) => (prev === overflow ? prev : overflow))

    if (!overflow) return

    const ratio = scroller.clientHeight / scroller.scrollHeight
    const thumbHeight = Math.max(36, scroller.clientHeight * ratio)
    const travel = Math.max(0, scroller.clientHeight - thumbHeight - 20)
    const scrollRatio =
      scroller.scrollHeight <= scroller.clientHeight
        ? 0
        : scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight)

    track.style.setProperty('--sidebar-thumb-top', `${10 + travel * scrollRatio}px`)
    track.style.setProperty('--sidebar-thumb-height', `${thumbHeight}px`)
  }, [])

  const updateLayout = useCallback(() => {
    const root = rootRef.current
    const scroller = scrollRef.current
    if (!root || !scroller) return

    if (window.innerWidth < 1024) {
      if (maxHeightRef.current !== null) {
        scroller.style.maxHeight = ''
        scroller.style.overflowY = ''
        maxHeightRef.current = null
      }
      setFade((prev) => (prev.active ? { top: false, bottom: false, active: false } : prev))
      setShowTrack((prev) => (prev ? false : prev))
      return
    }

    const parent = root.parentElement
    if (!parent) return

    const parentRect = parent.getBoundingClientRect()
    const rootRect = root.getBoundingClientRect()
    const stickTop = rootRect.top <= TOP_OFFSET + 2 ? TOP_OFFSET : rootRect.top
    const footerTop = getFooterTop()
    const viewportLimit = window.innerHeight - TOP_OFFSET - BOTTOM_OFFSET
    const containerLimit = parentRect.bottom - stickTop - BOTTOM_OFFSET
    const footerLimit = footerTop - stickTop - FOOTER_GAP

    const limits = [viewportLimit, containerLimit]
    if (Number.isFinite(footerLimit)) {
      limits.push(footerLimit)
    }

    const positiveLimits = limits.filter((value) => value > 0)
    const maxH = positiveLimits.length
      ? Math.max(180, Math.min(...positiveLimits))
      : viewportLimit

    const maxHeightPx = `${maxH}px`
    if (maxHeightRef.current !== maxHeightPx) {
      scroller.style.maxHeight = maxHeightPx
      scroller.style.overflowY = 'auto'
      maxHeightRef.current = maxHeightPx
    }

    const overflow = scroller.scrollHeight - maxH > 4

    updateFade(scroller, overflow)
    updateTrack(scroller, overflow)
  }, [updateFade, updateTrack])

  const scheduleLayout = useCallback(() => {
    window.cancelAnimationFrame(rafRef.current)
    rafRef.current = window.requestAnimationFrame(updateLayout)
  }, [updateLayout])

  useEffect(() => {
    scheduleLayout()

    const scroller = scrollRef.current
    const root = rootRef.current
    if (!scroller || !root) return

    const observer = new ResizeObserver(scheduleLayout)
    observer.observe(scroller)
    if (root.parentElement) observer.observe(root.parentElement)

    window.addEventListener('scroll', scheduleLayout, { passive: true })
    window.addEventListener('resize', scheduleLayout)

    return () => {
      window.cancelAnimationFrame(rafRef.current)
      observer.disconnect()
      window.removeEventListener('scroll', scheduleLayout)
      window.removeEventListener('resize', scheduleLayout)
    }
  }, [scheduleLayout, children])

  return (
    <div
      ref={rootRef}
      className={`relative w-full min-w-0 lg:sticky lg:top-4 lg:self-start ${engaged ? 'sidebar-scroll-root--engaged' : ''}`.trim()}
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => setEngaged(false)}
    >
      <div className="relative">
        {fade.active && fade.top ? (
          <div aria-hidden className="sidebar-scroll-fade sidebar-scroll-fade--top pointer-events-none absolute inset-x-0 top-0 z-10 hidden lg:block" />
        ) : null}

        {fade.active && fade.bottom ? (
          <div aria-hidden className="sidebar-scroll-fade sidebar-scroll-fade--bottom pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden lg:block" />
        ) : null}

        {showTrack ? (
          <div
            aria-hidden
            className={`sidebar-scroll-shell pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-3 lg:block ${engaged ? 'sidebar-scroll-shell--active' : ''}`}
          >
            <div ref={trackRef} className="sidebar-scroll-track" />
          </div>
        ) : null}

        <div
          ref={scrollRef}
          onScroll={scheduleLayout}
          className={`sidebar-scroll lg:pr-1.5 ${className}`.trim()}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
