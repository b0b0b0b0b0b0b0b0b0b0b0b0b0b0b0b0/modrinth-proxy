'use client'

import { useEffect, useRef, useState } from 'react'

function detectOS() {
  if (typeof navigator === 'undefined') return null
  const platform = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase()
  const ua = (navigator.userAgent || '').toLowerCase()
  const src = `${platform} ${ua}`

  if (/android/.test(src)) return 'Android'
  if (/iphone|ipad|ipod/.test(src)) return 'iOS'
  if (/win/.test(src)) return 'Windows'
  if (/mac/.test(src)) return 'macOS'
  if (/linux|x11|ubuntu|fedora|debian/.test(src)) return 'Linux'
  return null
}

const OS_TARGET = {
  Windows: 'download-os-windows',
  macOS: 'download-os-macos',
  Linux: 'download-os-linux',
}

const OS_END_OFFSET_X = {
  Windows: 16,
  macOS: 0,
  Linux: -16,
}

export default function DetectedOS() {
  const [os, setOs] = useState(null)
  const wordRef = useRef(null)
  const [path, setPath] = useState(null)

  useEffect(() => {
    setOs(detectOS())
  }, [])

  useEffect(() => {
    if (!os || !OS_TARGET[os]) return

    let frame = null

    const compute = () => {
      if (typeof window === 'undefined') return
      if (window.innerWidth < 768) {
        setPath(null)
        return
      }
      const word = wordRef.current
      const target = document.getElementById(OS_TARGET[os])
      if (!word || !target) {
        setPath(null)
        return
      }

      const w = word.getBoundingClientRect()
      const t = target.getBoundingClientRect()

      const start = { x: w.left + w.width / 2, y: w.bottom + 4 }
      const end = { x: t.left + t.width / 2 + (OS_END_OFFSET_X[os] || 0), y: t.top - 24 }

      if (end.y <= start.y + 20) {
        setPath(null)
        return
      }

      const dx = end.x - start.x
      const c1 = { x: start.x + dx * 0.1, y: start.y + (end.y - start.y) * 0.45 }
      const c2 = { x: end.x - dx * 0.1, y: end.y - (end.y - start.y) * 0.45 }

      setPath({
        d: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`,
        start,
      })
    }

    const schedule = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(compute)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('load', schedule)
    const settle = setTimeout(schedule, 600)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      clearTimeout(settle)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('load', schedule)
    }
  }, [os])

  if (!os) return null

  return (
    <>
      <p className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-modrinth-green opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-modrinth-green" />
        </span>
        А у тебя сейчас{' '}
        <span ref={wordRef} className="font-semibold text-modrinth-green">
          {os}
        </span>
      </p>

      {path ? (
        <svg
          className="pointer-events-none fixed inset-0 z-30 hidden h-screen w-screen md:block"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="os-arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L7,3 L0,6 Z" fill="rgb(var(--color-green-rgb))" />
            </marker>
          </defs>
          <circle cx={path.start.x} cy={path.start.y} r="3" fill="rgb(var(--color-green-rgb))" />
          <path
            d={path.d}
            stroke="rgb(var(--color-green-rgb))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 6"
            markerEnd="url(#os-arrowhead)"
            className="os-connector-path"
          />
        </svg>
      ) : null}
    </>
  )
}
