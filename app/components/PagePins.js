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
      setPins(collectRef.current({ x: box.left, y: box.top }))
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
