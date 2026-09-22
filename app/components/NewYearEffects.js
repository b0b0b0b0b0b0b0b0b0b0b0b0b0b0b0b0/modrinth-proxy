'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isNewYearSeason, NEW_YEAR_FORCE } from '@/lib/newYear'
import Garland from './Garland'

const FLAKES = Array.from({ length: 42 }, (_, i) => {
  const duration = 11 + (i % 10)
  return {
    left: ((i * 23) % 100) + (i % 7) * 0.3,
    delay: -((i * 3.17) % duration),
    duration,
    size: 8 + (i % 12),
    drift: 18 + (i * 13) % 50,
    kind: i % 3,
    sway: 5 + (i % 6),
  }
})

const MARKS = ['❄', '❅', '❆']
const HOST_SEL = 'main .universal-card, main .rounded-xl, main .rounded-lg, main .ny-snow-host'

function driftPath(width, kind) {
  const h = 15
  const steps = Math.max(4, Math.round(width / 54))
  let d = `M0 ${h} L0 ${h - 2}`
  for (let i = 1; i < steps; i++) {
    const x = (width * i) / steps
    const cy = 1 + ((i + kind) % 3) * 3.5
    const px = (width * (i - 0.5)) / steps
    d += ` Q ${px} ${cy} ${x} ${5 + ((i + kind) % 2) * 2}`
  }
  d += ` Q ${width - width * 0.04} ${h - 3} ${width} ${h - 2} L${width} ${h} Z`
  return d
}

function btnDriftPath(width, kind) {
  const h = 18
  return (
    `M0 0 L${width} 0 L${width} 8 ` +
    `C ${width - 10} ${12 + (kind % 2)} ${width * 0.82} ${h - 1} ${width * 0.68} ${h - 4} ` +
    `Q ${width * 0.5} ${h + 1} ${width * 0.32} ${h - 4} ` +
    `C ${width * 0.18} ${h - 1} 10 ${12 + (kind % 2)} 0 8 Z`
  )
}

function isBtnHost(el) {
  return el.matches('[data-download-modal], .ny-snow-cap, .modrinth-download-button')
}

function isFirstInSidebar(el) {
  const root = el.closest('.sidebar-scroll')
  if (!root) return false
  const hosts = [...root.querySelectorAll('.ny-snow-host')]
  return hosts[0] === el
}

function isHost(el) {
  if (el.closest('footer, nav, [role="dialog"], [role="menu"]')) return false
  if (el.closest('.sidebar-scroll') && !el.matches('.ny-snow-host')) return false
  if (el.matches('button, h1, h2, h3, h4, h5, h6, img, input, svg')) return false
  const r = el.getBoundingClientRect()
  return r.width > 160 && r.height > 56
}

function pickHosts() {
  const caps = [...document.querySelectorAll('[data-download-modal], .ny-snow-cap')]
  const cards = [...document.querySelectorAll(HOST_SEL)].filter(isHost)
  const nested = cards.filter((el) => !cards.some((other) => other !== el && el.contains(other)))
  return [...new Set([...caps, ...nested])]
}

function paint(el, kind) {
  const w = Math.round(el.clientWidth)
  if (w < 80) {
    el.querySelector(':scope > .newyear-drift')?.remove()
    return
  }
  const btn = isBtnHost(el)
  const inside = btn || isFirstInSidebar(el) || ['hidden', 'auto', 'scroll'].includes(getComputedStyle(el).overflowY)
  const h = inside ? 20 : 16
  let svg = el.querySelector(':scope > .newyear-drift')
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('aria-hidden', 'true')
    svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'))
    if (getComputedStyle(el).position === 'static') {
      el.dataset.nyPos = '1'
      el.style.position = 'relative'
    }
    el.appendChild(svg)
  }
  svg.setAttribute('class', inside ? 'newyear-drift newyear-drift--in' : 'newyear-drift')
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.querySelector('path').setAttribute('d', inside ? btnDriftPath(w, kind) : driftPath(w, kind))
}

function detach(el) {
  el.querySelector(':scope > .newyear-drift')?.remove()
  if (el.dataset.nyPos) {
    el.style.position = ''
    delete el.dataset.nyPos
  }
}

function syncDrifts() {
  const hosts = new Set(pickHosts())
  document.querySelectorAll('.newyear-drift').forEach((svg) => {
    if (!hosts.has(svg.parentElement)) detach(svg.parentElement)
  })
  ;[...hosts].forEach((el, i) => paint(el, i % 3))
}

export default function NewYearEffects() {
  const [on, setOn] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!isNewYearSeason()) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!NEW_YEAR_FORCE && reduce?.matches) return
    setOn(true)
  }, [])

  useEffect(() => {
    if (!on) return
    let t = 0
    const schedule = () => {
      window.clearTimeout(t)
      t = window.setTimeout(syncDrifts, 40)
    }
    syncDrifts()
    const later = window.setTimeout(syncDrifts, 500)
    const ro = new ResizeObserver(schedule)
    ro.observe(document.documentElement)
    const mo = new MutationObserver((records) => {
      if (records.every((r) => [...r.addedNodes, ...r.removedNodes].every((n) => n.classList?.contains('newyear-drift')))) {
        return
      }
      schedule()
    })
    const main = document.querySelector('main')
    if (main) mo.observe(main, { childList: true, subtree: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(later)
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', schedule)
      document.querySelectorAll('.newyear-drift').forEach((svg) => detach(svg.parentElement))
    }
  }, [on, pathname])

  if (!on) return null

  return (
    <>
      <Garland />
      <div className="newyear-layer" aria-hidden>
        {FLAKES.map((flake, i) => (
          <span
            key={i}
            className="newyear-flake"
            style={{
              left: `${flake.left}%`,
              fontSize: `${flake.size}px`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s, ${flake.sway}s`,
              '--ny-drift': `${flake.drift}px`,
            }}
          >
            {MARKS[flake.kind]}
          </span>
        ))}
      </div>
    </>
  )
}
