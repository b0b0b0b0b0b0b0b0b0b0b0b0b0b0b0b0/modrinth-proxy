'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const RESYNC_MS = 2000
const FIRST_SYNC_MS = 80

export function isScrollingWithPage(el) {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    const position = getComputedStyle(node).position
    if (position === 'fixed' || position === 'sticky') return false
  }
  return true
}

export function pinCards(limit) {
  const out = []
  for (const el of document.querySelectorAll('main .universal-card, main .rounded-xl, main .rounded-lg')) {
    if (out.length >= limit) break
    const r = el.getBoundingClientRect()
    if (r.width > 200 && r.height > 90 && isScrollingWithPage(el)) out.push(r)
  }
  return out
}

export function pinHeading() {
  const heading = document.querySelector('main h1')
  if (!heading || !isScrollingWithPage(heading)) return null
  return heading
}

const OBSTACLES = 'main a, main button, main input, main select, main textarea, main [role="button"], main [role="link"], header'
const GAP = 6

function textRect(el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  const r = range.getBoundingClientRect()
  range.detach?.()
  return r.width > 0 && r.height > 0 ? r : el.getBoundingClientRect()
}

function overlaps(a, b) {
  return a.left < b.right + GAP && a.right > b.left - GAP && a.top < b.bottom + GAP && a.bottom > b.top - GAP
}

export function spotIsFree(left, top, width, height) {
  const rect = { left, top, right: left + width, bottom: top + height }
  for (const el of document.querySelectorAll(OBSTACLES)) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0 && overlaps(rect, r)) return false
  }
  return true
}

export function headingSpot(width, height) {
  const heading = pinHeading()
  if (!heading) return null
  const text = textRect(heading)
  if (text.width < 24 || text.height < 16) return null
  const vw = document.documentElement.clientWidth
  const band = { top: text.top - height * 2, bottom: text.bottom + height }
  const obstacles = [...document.querySelectorAll(OBSTACLES)]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0 && r.bottom > band.top && r.top < band.bottom)
  const middle = text.top + text.height / 2 - height / 2
  const candidates = [
    { left: text.right + 10, top: middle },
    { left: text.right - width * 0.7, top: text.top - height * 0.85 },
    { left: text.left - width - 10, top: middle },
    { left: text.left - width * 0.2, top: text.top - height * 0.85 },
  ]
  for (const spot of candidates) {
    const rect = { left: spot.left, top: spot.top, right: spot.left + width, bottom: spot.top + height }
    if (rect.left < 4 || rect.right > vw - 4) continue
    if (obstacles.some((o) => overlaps(rect, o))) continue
    return { x: spot.left, y: spot.top }
  }
  return null
}

export function usePagePins(collect, { enabled, pathname }) {
  const layerRef = useRef(null)
  const collectRef = useRef(collect)
  collectRef.current = collect
  const [pins, setPins] = useState([])

  useEffect(() => {
    if (!enabled) {
      setPins([])
      return undefined
    }
    let frame = 0
    const sync = () => {
      const box = layerRef.current?.getBoundingClientRect()
      if (!box) return
      const base = { x: box.left, y: box.top }
      setPins(
        collectRef.current(base).filter((pin) => !pin.w || spotIsFree(pin.x + base.x, pin.y + base.y, pin.w, pin.h)),
      )
    }
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        sync()
      })
    }
    const start = window.setTimeout(sync, FIRST_SYNC_MS)
    const timer = window.setInterval(schedule, RESYNC_MS)
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    const mo = new MutationObserver(schedule)
    const main = document.querySelector('main')
    if (main) mo.observe(main, { childList: true, subtree: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('load', schedule)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(timer)
      cancelAnimationFrame(frame)
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('load', schedule)
    }
  }, [enabled, pathname])

  return { layerRef, pins }
}

export default function PagePinsLayer({ layerRef, children }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(
    <div ref={layerRef} className="page-pins" aria-hidden>
      {children}
    </div>,
    document.body,
  )
}
