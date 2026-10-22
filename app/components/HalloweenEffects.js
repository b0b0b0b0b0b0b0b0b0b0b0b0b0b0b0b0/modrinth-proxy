'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isHalloweenSeason, onGhostTurboChange, readGhostScore, readGhostTurbo, writeGhostScore } from '@/lib/halloween'
import { useT } from './I18nProvider'
import { playPoof } from './softSounds'

const EMBERS = [
  { left: 18, delay: 0, duration: 9 },
  { left: 41, delay: 3, duration: 11 },
  { left: 67, delay: 5.5, duration: 8 },
  { left: 84, delay: 1.6, duration: 12 },
]

function inView(r, pad = 24) {
  return r.width > 24 && r.height > 16 && r.bottom > pad && r.top < window.innerHeight - pad
}

function collectAnchors() {
  const out = []
  const vw = window.innerWidth

  const heading = document.querySelector('main h1')
  if (heading) {
    const r = heading.getBoundingClientRect()
    let right = r.right
    for (let el = heading.nextElementSibling; el; el = el.nextElementSibling) {
      const s = el.getBoundingClientRect()
      if (s.width > 0 && s.top < r.bottom && s.bottom > r.top) right = Math.max(right, s.right)
    }
    out.push({
      id: 'eyes-h1',
      type: 'eyes',
      x: right + 12,
      y: r.top + Math.max(2, r.height / 2 - 10),
      show: inView(r, 48) && right + 64 <= vw,
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

function Ghost({ happy = false }) {
  return (
    <svg viewBox="0 0 48 56" aria-hidden>
      <path
        fill="currentColor"
        d="M24 4c12 0 20 10 20 22v22c0 2-2.2 2-3.4.4L36 42l-5 7.2c-1 1.4-3 1.4-4 0L24 42l-3 7.2c-1 1.4-3 1.4-4 0L12 42l-4.6 6.4C6.2 50 4 50 4 48V26C4 14 12 4 24 4z"
      />
      {happy ? (
        <>
          <path d="M13.5 25q3.5-4.5 7 0M27.5 25q3.5-4.5 7 0" fill="none" stroke="#2a2118" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M19 31q5 5.5 10 0" fill="none" stroke="#2a2118" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="13" cy="31" rx="2.6" ry="1.6" fill="#ff8fb1" opacity="0.7" />
          <ellipse cx="35" cy="31" rx="2.6" ry="1.6" fill="#ff8fb1" opacity="0.7" />
        </>
      ) : (
        <>
          <circle cx="17" cy="24" r="3.2" fill="#2a2118" />
          <circle cx="31" cy="24" r="3.2" fill="#2a2118" />
          <ellipse cx="24" cy="33" rx="4" ry="2.2" fill="#2a2118" opacity="0.45" />
        </>
      )}
    </svg>
  )
}

const GHOST_PACE = {
  calm: { max: 3, every: 2600, first: 1200, duration: [9, 5], sway: [2.4, 1.6] },
  turbo: { max: 5, every: 1000, first: 400, duration: [6.5, 2.5], sway: [2, 1.2] },
}

function spawnCatchGhost(id, pace) {
  return {
    id,
    left: 6 + Math.random() * 86,
    duration: pace.duration[0] + Math.random() * pace.duration[1],
    size: 44 + Math.round(Math.random() * 16),
    sway: pace.sway[0] + Math.random() * pace.sway[1],
    drift: `${(Math.random() * 2 - 1) * 60}px`,
    caught: false,
  }
}

function GhostGame({ onCatch }) {
  const [ghosts, setGhosts] = useState([])
  const [turbo, setTurbo] = useState(false)
  const seq = useRef(0)

  useEffect(() => {
    setTurbo(readGhostTurbo())
    return onGhostTurboChange(setTurbo)
  }, [])

  useEffect(() => {
    const pace = turbo ? GHOST_PACE.turbo : GHOST_PACE.calm
    const tick = () => {
      setGhosts((list) => {
        if (list.filter((g) => !g.caught).length >= pace.max) return list
        seq.current += 1
        return [...list, spawnCatchGhost(seq.current, pace)]
      })
    }
    const first = window.setTimeout(tick, pace.first)
    const id = window.setInterval(tick, pace.every)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [turbo])

  const remove = (id) => setGhosts((list) => list.filter((g) => g.id !== id))

  const caught = (ghost, event) => {
    event.preventDefault()
    event.stopPropagation()
    if (ghost.caught) return
    playPoof()
    onCatch()
    setGhosts((list) => list.map((g) => (g.id === ghost.id ? { ...g, caught: true } : g)))
    window.setTimeout(() => remove(ghost.id), 650)
  }

  return (
    <div className="halloween-game">
      {ghosts.map((ghost) => (
        <button
          key={ghost.id}
          type="button"
          tabIndex={-1}
          aria-hidden
          className={`halloween-catch${ghost.caught ? ' halloween-catch--caught' : ''}`}
          style={{
            left: `${ghost.left}%`,
            width: ghost.size,
            animationDuration: `${ghost.duration}s`,
            '--halloween-drift': ghost.drift,
          }}
          onPointerDown={(event) => caught(ghost, event)}
          onAnimationEnd={(event) => {
            if (event.animationName === 'halloween-rise') remove(ghost.id)
          }}
        >
          <span className="halloween-catch-body" style={{ animationDuration: `${ghost.sway}s` }}>
            <Ghost happy={ghost.caught} />
          </span>
          {ghost.caught ? (
            <span className="halloween-poof">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} style={{ '--halloween-puff': `${i * 60}deg` }} />
              ))}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

function GhostBanner({ caught }) {
  const t = useT()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem('halloweenBannerOff') === '1') return
    } catch {}
    setOpen(true)
  }, [])

  if (!open) return null

  return (
    <div className="halloween-banner" role="status">
      <span className="halloween-banner-ghost">
        <Ghost />
      </span>
      <div className="halloween-banner-copy">
        <p className="halloween-banner-title">{t('halloween.title')}</p>
        <p className="halloween-banner-play">{t('halloween.play')}</p>
      </div>
      <span className="halloween-banner-score" title={t('halloween.scoreTitle')}>
        <span className="halloween-banner-ghost halloween-banner-ghost--small">
          <Ghost happy />
        </span>
        {caught}
      </span>
      <button
        type="button"
        className="halloween-banner-close"
        aria-label={t('halloween.close')}
        onClick={() => {
          try {
            sessionStorage.setItem('halloweenBannerOff', '1')
          } catch {}
          setOpen(false)
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
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
  const [caught, setCaught] = useState(0)

  useEffect(() => {
    setCaught(readGhostScore())
  }, [])

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


  if (!on) return null

  return (
    <>
    <GhostBanner caught={caught} />
    <GhostGame
      onCatch={() =>
        setCaught((n) => {
          const next = n + 1
          writeGhostScore(next)
          return next
        })
      }
    />
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
    </>
  )
}
