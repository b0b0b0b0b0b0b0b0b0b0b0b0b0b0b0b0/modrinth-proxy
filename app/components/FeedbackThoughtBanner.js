'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'feedbackThoughtDismissed'
const Y_KEY = 'feedbackThoughtY'
const SIDE_KEY = 'feedbackThoughtSide'
const PIN_KEY = 'feedbackThoughtPin'

function isDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function getYRatio() {
  try {
    const saved = sessionStorage.getItem(Y_KEY)
    if (saved != null) {
      const n = Number(saved)
      if (n >= 0 && n <= 1) return n
    }
    const n = 0.22 + Math.random() * 0.4
    sessionStorage.setItem(Y_KEY, String(n))
    return n
  } catch {
    return 0.32
  }
}

function getMobileSide() {
  try {
    const saved = sessionStorage.getItem(SIDE_KEY)
    if (saved === 'left' || saved === 'right') return saved
    const side = Math.random() < 0.5 ? 'left' : 'right'
    sessionStorage.setItem(SIDE_KEY, side)
    return side
  } catch {
    return 'left'
  }
}

function readPin() {
  try {
    const raw = sessionStorage.getItem(PIN_KEY)
    if (!raw) return null
    const pin = JSON.parse(raw)
    if (typeof pin?.rx === 'number' && typeof pin?.ry === 'number') return pin
  } catch {}
  return null
}

function writePin(x, y, w, h) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxX = Math.max(1, vw - w)
  const maxY = Math.max(1, vh - h)
  try {
    sessionStorage.setItem(
      PIN_KEY,
      JSON.stringify({
        rx: Math.min(1, Math.max(0, x / maxX)),
        ry: Math.min(1, Math.max(0, y / maxY)),
      }),
    )
  } catch {}
}

function pinToCoords(pin, w, h) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxX = Math.max(0, vw - w)
  const maxY = Math.max(0, vh - h)
  return {
    x: Math.min(maxX, Math.max(0, pin.rx * maxX)),
    y: Math.min(maxY, Math.max(0, pin.ry * maxY)),
  }
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
}

function computeHome() {
  const main = document.querySelector('main.container')
  const vw = window.innerWidth
  const vh = window.innerHeight
  const compact = vw < 1024
  const plaqueW = compact ? 220 : 256
  const plaqueH = 118
  const topPad = compact ? 64 : 88
  const botPad = compact ? 92 : 24
  const rect = main?.getBoundingClientRect()

  let x
  if (rect && rect.left >= plaqueW + 24) {
    x = rect.left - plaqueW - 16
  } else {
    const side = getMobileSide()
    x = side === 'right' ? Math.max(8, vw - plaqueW - 12) : 12
  }

  const minTop = topPad
  const maxTop = Math.max(minTop, vh - plaqueH - botPad)
  const y = minTop + getYRatio() * (maxTop - minTop)

  return { x, y, w: plaqueW, h: plaqueH }
}

function clampPos(x, y, w, h) {
  const maxX = Math.max(0, window.innerWidth - w)
  const maxY = Math.max(0, window.innerHeight - h)
  return {
    x: Math.min(maxX, Math.max(0, x)),
    y: Math.min(maxY, Math.max(0, y)),
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

export default function FeedbackThoughtBanner() {
  const pathname = usePathname()
  const rootRef = useRef(null)
  const posRef = useRef({ x: 0, y: 0 })
  const sizeRef = useRef({ w: 256, h: 118 })
  const flightRef = useRef(null)
  const thinkRef = useRef(null)
  const rafRef = useRef(0)
  const shownRef = useRef(false)
  const pinnedRef = useRef(false)
  const dragRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(256)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (isDismissed()) {
      setVisible(false)
      return
    }
    if (pathname?.startsWith('/extension')) {
      setVisible(false)
      return
    }

    const writeTransform = () => {
      const el = rootRef.current
      if (!el) return
      const { x, y } = posRef.current
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    const measure = () => {
      const el = rootRef.current
      const w = el?.offsetWidth || sizeRef.current.w
      const h = el?.offsetHeight || sizeRef.current.h
      sizeRef.current = { w, h }
      return sizeRef.current
    }

    const startFlight = (to) => {
      if (pinnedRef.current || dragRef.current) return
      const from = posRef.current
      const dist = Math.hypot(to.x - from.x, to.y - from.y)
      if (dist < 12 || prefersReducedMotion()) {
        posRef.current = { x: to.x, y: to.y }
        writeTransform()
        flightRef.current = null
        return
      }
      flightRef.current = {
        x0: from.x,
        y0: from.y,
        x1: to.x,
        y1: to.y,
        t0: performance.now(),
        dur: Math.min(900, Math.max(420, 320 + dist * 0.7)),
      }
    }

    const thinkThenFly = (to) => {
      if (pinnedRef.current || dragRef.current) return
      window.clearTimeout(thinkRef.current)
      thinkRef.current = window.setTimeout(() => {
        startFlight(to)
      }, prefersReducedMotion() ? 0 : 220)
    }

    const tick = (now) => {
      const flight = flightRef.current
      if (flight && !dragRef.current) {
        const t = Math.min(1, (now - flight.t0) / flight.dur)
        const k = easeInOutCubic(t)
        posRef.current = {
          x: flight.x0 + (flight.x1 - flight.x0) * k,
          y: flight.y0 + (flight.y1 - flight.y0) * k,
        }
        writeTransform()
        if (t >= 1) flightRef.current = null
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    const place = (mode) => {
      const home = computeHome()
      setWidth(home.w)
      sizeRef.current = { w: home.w, h: home.h }

      const pin = readPin()
      if (pin) {
        pinnedRef.current = true
        const { w, h } = measure()
        posRef.current = pinToCoords(pin, w, h)
        if (!shownRef.current) {
          shownRef.current = true
          setVisible(true)
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(writeTransform)
        })
        return
      }

      if (!shownRef.current) {
        posRef.current = { x: home.x, y: home.y }
        shownRef.current = true
        setVisible(true)
        requestAnimationFrame(() => {
          requestAnimationFrame(writeTransform)
        })
        return
      }

      if (pinnedRef.current || dragRef.current) {
        const { w, h } = measure()
        posRef.current = clampPos(posRef.current.x, posRef.current.y, w, h)
        writeTransform()
        return
      }

      if (mode === 'scroll') {
        thinkThenFly(home)
        return
      }
      posRef.current = { x: home.x, y: home.y }
      writeTransform()
    }

    const onScroll = () => place('scroll')
    const onResize = () => place('resize')

    const startTimer = window.setTimeout(() => {
      place('spawn')
      rafRef.current = requestAnimationFrame(tick)
    }, 500)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(thinkRef.current)
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [pathname])

  useEffect(() => {
    if (!visible) return
    const el = rootRef.current
    if (!el) return

    const writeTransform = () => {
      const node = rootRef.current
      if (!node) return
      const { x, y } = posRef.current
      node.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    const measure = () => {
      const node = rootRef.current
      const w = node?.offsetWidth || sizeRef.current.w
      const h = node?.offsetHeight || sizeRef.current.h
      sizeRef.current = { w, h }
      return sizeRef.current
    }

    const onPointerDown = (event) => {
      if (event.button != null && event.button !== 0) return
      if (event.target.closest('button, a')) return

      const { w, h } = measure()
      dragRef.current = {
        id: event.pointerId,
        dx: event.clientX - posRef.current.x,
        dy: event.clientY - posRef.current.y,
        moved: false,
        w,
        h,
      }
      flightRef.current = null
      window.clearTimeout(thinkRef.current)
      el.setPointerCapture?.(event.pointerId)
    }

    const onPointerMove = (event) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.id) return
      const next = clampPos(event.clientX - drag.dx, event.clientY - drag.dy, drag.w, drag.h)
      if (!drag.moved) {
        const dist = Math.hypot(next.x - posRef.current.x, next.y - posRef.current.y)
        if (dist < 4) return
        drag.moved = true
        pinnedRef.current = true
        setDragging(true)
      }
      posRef.current = next
      writeTransform()
    }

    const endDrag = (event) => {
      const drag = dragRef.current
      if (!drag || (event && event.pointerId !== drag.id)) return
      const { w, h } = measure()
      posRef.current = clampPos(posRef.current.x, posRef.current.y, w, h)
      writeTransform()
      if (drag.moved) {
        writePin(posRef.current.x, posRef.current.y, w, h)
      }
      dragRef.current = null
      setDragging(false)
    }

    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [visible])

  const handleDismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
  }

  const handleOpenIssues = () => {
    handleDismiss()
    window.open(
      'https://github.com/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy/issues/new',
      '_blank',
      'noopener,noreferrer'
    )
  }

  if (!visible) return null

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${width}px`,
        transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`,
        willChange: 'transform',
        touchAction: 'none',
      }}
      className={`z-30 pointer-events-auto select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div className="relative animate-thought-pop">
        <div className="feedback-thought">
          <button
            type="button"
            onClick={handleDismiss}
            title="Закрыть"
            aria-label="Закрыть"
            className="absolute right-3 top-2.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <p className="mb-2.5 pr-5 text-xs font-semibold leading-relaxed">
            У тебя есть предложение или нашёл баг?
          </p>

          <button
            type="button"
            onClick={handleOpenIssues}
            className="inline-flex cursor-pointer items-center rounded-full bg-modrinth-green px-3 py-1.5 text-xs font-bold text-black shadow transition-all duration-200 hover:bg-modrinth-green-light active:scale-95"
          >
            Напиши нам
          </button>
        </div>
      </div>
    </div>
  )
}
