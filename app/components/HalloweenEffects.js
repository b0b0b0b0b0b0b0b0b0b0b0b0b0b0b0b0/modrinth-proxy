'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isHalloweenSeason } from '@/lib/halloween'

const GHOSTS = [
  { left: 3, top: 34, delay: 0, duration: 7.5, size: 46 },
  { left: 89, top: 48, delay: 1.8, duration: 9, size: 36 },
  { left: 6, top: 62, delay: 4.2, duration: 8, size: 32 },
]

const EMBERS = [
  { left: 18, delay: 0, duration: 9 },
  { left: 41, delay: 3, duration: 11 },
  { left: 67, delay: 5.5, duration: 8 },
  { left: 84, delay: 1.6, duration: 12 },
]

const BAT_COUNT = 9
const BAT_GIF =
  'data:image/gif;base64,R0lGODlhMAAwAJECAAAAAEJCQv///////yH/C05FVFNDQVBFMi4wAwEAAAAh+QQJAQACACwAAAAAMAAwAAACdpSPqcvtD6NcYNpbr4Z5ewV0UvhRohOe5UE+6cq0carCgpzQuM3ut16zvRBAH+/XKQ6PvaQyCFs+mbnWlEq0FrGi15XZJSmxP8OTRj4DyWY1lKdmV8fyLL3eXOPn6D3f6BcoOEhYaHiImKi4yNjo+AgZKTl5WAAAIfkECQEAAgAsAAAAADAAMAAAAnyUj6nL7Q+jdCDWicF9G1vdeWICao05ciUVpkrZIqjLwCdI16s+5wfck+F8JOBiR/zZZAJk0mAsDp/KIHRKvVqb2KxTu/Vdvt/nGFs2V5Bpta3tBcKp8m5WWL/z5PpbtH/0B/iyNGh4iJiouMjY6PgIGSk5SVlpeYmZqVkAACH5BAkBAAIALAAAAAAwADAAAAJhlI+py+0Po5y02ouz3rz7D4biSJbmiabq6gCs4B5AvM7GTKv4buby7vsAbT9gZ4h0JYmZpXO4YEKeVCk0QkVUlw+uYovE8ibgaVBSLm1Pa3W194rL5/S6/Y7P6/f8vp9SAAAh+QQJAQACACwAAAAAMAAwAAACZZSPqcvtD6OctNqLs968+w+G4kiW5omm6ooALeCusAHHclyzQs3rOz9jAXuqIRFlPJ6SQWRSaIQOpUBqtfjEZpfMJqmrHIFtpbGze2ZywWu0aUwWEbfiZvQdD4sXuWUj7gPos1EAACH5BAkBAAIALAAAAAAwADAAAAJrlI+py+0Po5y02ouz3rz7D4ZiCIxUaU4Amjrr+rDg+7ojXTdyh+e7kPP0egjabGg0EIVImHLJa6KaUam1aqVynNNsUvPTQjO/J84cFA3RzlaJO2495TF63Y7P6/f8vv8PGCg4SFhoeIg4UQAAIfkEBQEAAgAsAAAAADAAMAAAAnaUj6nL7Q+jXGDaW6+GeXsFdFL4UaITnuVBPunKtHGqwoKc0LjN7rdes70QQB/v1ykOj72kMghbPpm51pRKtBaxoteV2SUpsT/Dk0Y+A8lmNZSnZlfH8iy93lzj5+g93+gXKDhIWGh4iJiouMjY6PgIGSk5eVgAADs='

function spawnBat() {
  const rand = Math.random
  const wrap = document.createElement('div')
  const img = document.createElement('img')
  wrap.className = 'halloween-jsbat'
  img.src = BAT_GIF
  img.alt = ''
  img.draggable = false
  wrap.appendChild(img)
  document.body.appendChild(wrap)

  let ax = window.innerWidth * rand()
  let ay = window.innerHeight * rand()
  let alive = true
  let timer = 0

  const jump = (origin, max) => Math.max(Math.min(origin + (rand() - 0.5) * 400, max - 50), 50)

  const fly = () => {
    if (!alive) return
    const x = jump(ax, window.innerWidth)
    const y = jump(ay, window.innerHeight)
    const dist = 5 * Math.hypot(ax - x, ay - y)
    wrap.style.opacity = '1'
    wrap.style.transition = `${dist / 1000}s linear`
    wrap.style.transform = `translate(${x}px, ${y}px)`
    img.style.transform = ax > x ? 'none' : 'scaleX(-1)'
    ax = x
    ay = y
    timer = window.setTimeout(fly, dist)
  }

  timer = window.setTimeout(fly, rand() * 2500)

  return () => {
    alive = false
    window.clearTimeout(timer)
    wrap.remove()
  }
}

function inView(r, pad = 24) {
  return r.width > 24 && r.height > 16 && r.bottom > pad && r.top < window.innerHeight - pad
}

function collectAnchors() {
  const out = []
  const vw = window.innerWidth

  const heading = document.querySelector('main h1')
  if (heading) {
    const r = heading.getBoundingClientRect()
    out.push({
      id: 'eyes-h1',
      type: 'eyes',
      x: Math.min(r.right + 12, vw - 52),
      y: r.top + Math.max(2, r.height / 2 - 10),
      show: inView(r, 48),
    })
  }

  const cards = [...document.querySelectorAll('main .universal-card, main .rounded-xl, main .rounded-lg')].filter(
    (el) => {
      const r = el.getBoundingClientRect()
      return r.width > 200 && r.height > 90
    },
  )

  cards.slice(0, 4).forEach((el, i) => {
    const r = el.getBoundingClientRect()
    const show = inView(r, 56)
    if (i === 0) {
      out.push({
        id: 'pk-card',
        type: 'pumpkin',
        x: r.right - 62,
        y: r.bottom - 58,
        show,
        size: 54,
      })
    } else {
      const left = i % 2 === 1
      out.push({
        id: `eyes-card-${i}`,
        type: 'eyes',
        x: left ? r.left + 14 : r.right - 46,
        y: r.top + 12,
        show,
      })
    }
  })

  return out
}

function Pumpkin({ className }) {
  return (
    <svg viewBox="0 0 72 70" className={className} aria-hidden>
      <ellipse cx="36" cy="42" rx="30" ry="24" fill="#f08a24" />
      <ellipse cx="22" cy="42" rx="12" ry="22" fill="#ff9f3c" opacity="0.85" />
      <ellipse cx="50" cy="42" rx="12" ry="22" fill="#e07818" opacity="0.9" />
      <path d="M36 10c2 6 1 12 0 16-4-2-7-8-5-14 2-1 4-2 5-2z" fill="#3d8f3a" />
      <path d="M24 36l7 5 7-8 7 8 7-5" fill="none" stroke="#3a1d08" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="26,30 31,38 21,38" fill="#ffe566" />
      <polygon points="46,30 51,38 41,38" fill="#ffe566" />
      <path d="M24 48c4 7 20 8 24 0  -4 4-20 4-24 0z" fill="#2a1408" />
      <path d="M28 50c3 3 13 3 16 0" fill="#ffe566" opacity="0.85" />
    </svg>
  )
}

function Ghost() {
  return (
    <svg viewBox="0 0 48 56" aria-hidden>
      <path
        fill="currentColor"
        d="M24 4c12 0 20 10 20 22v22c0 2-2.2 2-3.4.4L36 42l-5 7.2c-1 1.4-3 1.4-4 0L24 42l-3 7.2c-1 1.4-3 1.4-4 0L12 42l-4.6 6.4C6.2 50 4 50 4 48V26C4 14 12 4 24 4z"
      />
      <circle cx="17" cy="24" r="3.2" fill="#2a2118" />
      <circle cx="31" cy="24" r="3.2" fill="#2a2118" />
      <ellipse cx="24" cy="33" rx="4" ry="2.2" fill="#2a2118" opacity="0.45" />
    </svg>
  )
}

function Eyes() {
  return (
    <>
      <span className="halloween-eye" />
      <span className="halloween-eye" />
    </>
  )
}

export default function HalloweenEffects() {
  const pathname = usePathname()
  const [on, setOn] = useState(false)
  const [anchors, setAnchors] = useState([])

  useEffect(() => {
    if (!isHalloweenSeason()) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reduce?.matches) return
    setOn(true)
  }, [])

  useEffect(() => {
    if (!on) return
    let frame = 0
    const sync = () => {
      setAnchors(collectAnchors())
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        sync()
      })
    }
    const start = window.setTimeout(sync, 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.clearTimeout(start)
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [on, pathname])

  useEffect(() => {
    if (!on) return
    const stopBats = Array.from({ length: BAT_COUNT }, () => spawnBat())
    return () => stopBats.forEach((stop) => stop())
  }, [on])

  if (!on) return null

  return (
    <div className="halloween-layer" aria-hidden>
      {anchors.map((item) => (
        <span
          key={item.id}
          className={`halloween-pin halloween-pin--${item.type}`}
          style={{
            transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
            opacity: item.show ? 1 : 0,
            width: item.size,
          }}
        >
          {item.type === 'pumpkin' ? <Pumpkin className="halloween-pumpkin" /> : <Eyes />}
        </span>
      ))}
      {GHOSTS.map((ghost, i) => (
        <span
          key={`g${i}`}
          className="halloween-ghost"
          style={{
            left: `${ghost.left}%`,
            top: `${ghost.top}%`,
            animationDelay: `${ghost.delay}s`,
            animationDuration: `${ghost.duration}s`,
            width: ghost.size,
          }}
        >
          <Ghost />
        </span>
      ))}
      {EMBERS.map((ember, i) => (
        <span
          key={`e${i}`}
          className="halloween-ember"
          style={{
            left: `${ember.left}%`,
            animationDelay: `${ember.delay}s`,
            animationDuration: `${ember.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
