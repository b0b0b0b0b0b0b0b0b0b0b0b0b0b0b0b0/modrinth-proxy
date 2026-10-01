'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isBirthdaySeason, readCookieScore, writeCookieScore } from '@/lib/birthday'
import { useT } from './I18nProvider'

const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: ((i * 19) % 100) + (i % 5) * 0.4,
  delay: -((i * 2.4) % 9),
  duration: 8 + (i % 7),
  size: 6 + (i % 8),
  rot: (i * 47) % 360,
  kind: i % 3,
  color: i % 6,
}))

const BALLOONS = [
  { left: 4, bottom: 8, delay: 0, duration: 7.2, size: 42, color: 0 },
  { left: 14, bottom: 18, delay: 1.4, duration: 8.4, size: 34, color: 1, desk: true },
  { left: 78, bottom: 10, delay: 0.8, duration: 7.8, size: 40, color: 2 },
  { left: 90, bottom: 22, delay: 2.1, duration: 9, size: 32, color: 3, desk: true },
  { left: 48, bottom: 4, delay: 3, duration: 8, size: 28, color: 4, desk: true },
]

const COLORS = ['#ff6b9d', '#62c4ff', '#7ee0a0', '#ffd166', '#c084fc', '#ff8a5b']

function inView(r, pad = 24) {
  return r.width > 24 && r.height > 16 && r.bottom > pad && r.top < window.innerHeight - pad
}

function collectPins() {
  const out = []
  const heading = document.querySelector('main h1')
  if (heading) {
    const r = heading.getBoundingClientRect()
    out.push({
      id: 'cake-h1',
      type: 'cake',
      x: Math.min(r.right + 8, window.innerWidth - 48),
      y: r.top + Math.max(0, r.height / 2 - 16),
      show: inView(r, 40),
    })
  }
  const cards = [...document.querySelectorAll('main .universal-card, main .rounded-xl, main .rounded-lg')].filter(
    (el) => {
      const r = el.getBoundingClientRect()
      return r.width > 200 && r.height > 90
    },
  )
  cards.slice(0, 3).forEach((el, i) => {
    const r = el.getBoundingClientRect()
    const left = i % 2 === 0
    out.push({
      id: `hat-${i}`,
      type: 'hat',
      x: left ? r.left + 10 : r.right - 36,
      y: r.top - 10,
      show: inView(r, 40),
      color: COLORS[i % COLORS.length],
      tilt: left ? -26 - (i % 3) * 4 : 18 + (i % 3) * 5,
    })
  })
  return out
}

function Cake() {
  return (
    <svg viewBox="0 0 40 40" className="bday-cake" aria-hidden>
      <rect x="8" y="18" width="24" height="14" rx="3" fill="#f4c2d7" />
      <rect x="8" y="14" width="24" height="8" rx="3" fill="#ffe08a" />
      <rect x="8" y="22" width="24" height="5" fill="#ff8fb8" opacity="0.85" />
      <rect x="19" y="6" width="2.4" height="9" rx="1" fill="#8d6e63" />
      <ellipse cx="20.2" cy="5" rx="2.2" ry="2.6" fill="#ffb703" />
    </svg>
  )
}

function Hat({ color }) {
  return (
    <svg viewBox="0 0 36 40" className="bday-hat" aria-hidden>
      <polygon points="18,2 34,36 2,36" fill={color} />
      <ellipse cx="18" cy="36" rx="16" ry="3.2" fill={color} opacity="0.85" />
      <circle cx="18" cy="4" r="3.4" fill="#ffe566" />
      <path d="M8 24h20" stroke="#fff" strokeWidth="2" opacity="0.55" />
    </svg>
  )
}

function Balloon({ color }) {
  return (
    <svg viewBox="0 0 36 64" aria-hidden>
      <ellipse cx="18" cy="18" rx="14" ry="17" fill={color} />
      <ellipse cx="12" cy="12" rx="4" ry="6" fill="#fff" opacity="0.35" />
      <path d="M18 35l-3 4h6z" fill={color} />
      <path d="M18 39c0 8 4 10 1 16s-4 6 0 9" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function Cookie() {
  return (
    <svg viewBox="0 0 48 48" className="bday-cookie-svg" aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#d4a056" />
      <circle cx="24" cy="24" r="16.2" fill="#e8b86a" />
      <circle cx="16" cy="18" r="3.1" fill="#5c3310" />
      <circle cx="28" cy="15" r="2.4" fill="#4a2a0c" />
      <circle cx="32" cy="26" r="2.8" fill="#5c3310" />
      <circle cx="20" cy="30" r="2.2" fill="#3e220a" />
      <circle cx="27" cy="34" r="2.6" fill="#5c3310" />
      <circle cx="14" cy="26" r="1.8" fill="#4a2a0c" />
    </svg>
  )
}

let crunchCtx = null

function playCrunch() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  if (!crunchCtx) crunchCtx = new AC()
  if (crunchCtx.state === 'suspended') crunchCtx.resume()
  const burst = (when, freq) => {
    const dur = 0.1
    const rate = crunchCtx.sampleRate
    const buf = crunchCtx.createBuffer(1, Math.floor(rate * dur), rate)
    const ch = buf.getChannelData(0)
    for (let i = 0; i < ch.length; i++) {
      const t = i / ch.length
      ch[i] = (Math.random() * 2 - 1) * (1 - t) ** 2 * (Math.random() > 0.22 ? 1 : 0.12)
    }
    const src = crunchCtx.createBufferSource()
    src.buffer = buf
    const hp = crunchCtx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 380
    const bp = crunchCtx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = freq
    bp.Q.value = 0.75
    const g = crunchCtx.createGain()
    g.gain.value = 0.32
    src.connect(hp)
    hp.connect(bp)
    bp.connect(g)
    g.connect(crunchCtx.destination)
    src.start(when)
  }
  const t = crunchCtx.currentTime
  burst(t, 1500 + Math.random() * 700)
  burst(t + 0.055, 880 + Math.random() * 420)
}

function spawnCookie(id) {
  return {
    id,
    left: 8 + Math.random() * 84,
    duration: 6.5 + Math.random() * 4,
    size: 42 + Math.round(Math.random() * 16),
    drift: `${(Math.random() * 2 - 1) * 48}px`,
    spin: Math.random() > 0.5 ? 1 : -1,
  }
}

function BirthdayBanner({ on, eaten }) {
  const t = useT()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!on) return
    try {
      if (sessionStorage.getItem('bdayBannerOff') === '1') return
    } catch {}
    setOpen(true)
  }, [on])

  if (!on || !open) return null

  return (
    <div className="bday-banner" role="status">
      <Cake />
      <div className="bday-banner-copy">
        <p className="bday-banner-title">{t('birthday.title')}</p>
        <p className="bday-banner-text">{t('birthday.banner')}</p>
        <p className="bday-banner-play">{t('birthday.play')}</p>
      </div>
      <span className="bday-banner-score" title={t('birthday.play')}>
        <Cookie />
        {t('birthday.score', { n: eaten })}
      </span>
      <button
        type="button"
        className="bday-banner-close"
        aria-label={t('birthday.close')}
        onClick={() => {
          try {
            sessionStorage.setItem('bdayBannerOff', '1')
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

function CookieGame({ on, onEat }) {
  const [cookies, setCookies] = useState([])
  const seq = useRef(0)

  useEffect(() => {
    if (!on) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reduce?.matches) return
    const tick = () => {
      setCookies((list) => {
        if (list.length >= 4) return list
        seq.current += 1
        return [...list, spawnCookie(seq.current)]
      })
    }
    tick()
    const id = window.setInterval(tick, 1600)
    return () => window.clearInterval(id)
  }, [on])

  if (!on) return null

  const eat = (id, event) => {
    event.preventDefault()
    event.stopPropagation()
    playCrunch()
    onEat()
    setCookies((list) => list.filter((c) => c.id !== id))
  }

  return (
    <div className="bday-game">
      {cookies.map((cookie) => (
        <button
          key={cookie.id}
          type="button"
          className="bday-cookie"
          style={{
            left: `${cookie.left}%`,
            width: cookie.size,
            animationDuration: `${cookie.duration}s`,
            '--bday-drift': cookie.drift,
            '--bday-spin': cookie.spin,
          }}
          onPointerDown={(event) => eat(cookie.id, event)}
          onAnimationEnd={() => setCookies((list) => list.filter((c) => c.id !== cookie.id))}
        >
          <Cookie />
        </button>
      ))}
    </div>
  )
}

export default function BirthdayEffects() {
  const pathname = usePathname()
  const [on, setOn] = useState(false)
  const [pins, setPins] = useState([])
  const [eaten, setEaten] = useState(0)

  useEffect(() => {
    setEaten(readCookieScore())
  }, [])

  useEffect(() => {
    if (!isBirthdaySeason()) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reduce?.matches) {
      setOn(true)
      return
    }
    setOn(true)
  }, [])

  useEffect(() => {
    if (!on) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reduce?.matches) return
    let frame = 0
    const sync = () => setPins(collectPins())
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

  return (
    <>
      <BirthdayBanner on={on} eaten={eaten} />
      <CookieGame
        on={on}
        onEat={() => {
          setEaten((n) => {
            const next = n + 1
            writeCookieScore(next)
            return next
          })
        }}
      />
      {on ? (
        <div className="bday-layer" aria-hidden>
          {CONFETTI.map((bit, i) => (
            <span
              key={`c${i}`}
              className={`bday-confetti bday-confetti--${bit.kind}`}
              style={{
                left: `${bit.left}%`,
                width: bit.size,
                height: bit.kind === 1 ? bit.size : bit.size * 1.4,
                background: COLORS[bit.color],
                animationDelay: `${bit.delay}s`,
                animationDuration: `${bit.duration}s`,
                '--bday-rot': `${bit.rot}deg`,
              }}
            />
          ))}
          {BALLOONS.map((b, i) => (
            <span
              key={`b${i}`}
              className={`bday-balloon${b.desk ? ' bday-balloon--desk' : ''}`}
              style={{
                left: `${b.left}%`,
                bottom: `${b.bottom}%`,
                width: b.size,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.duration}s`,
                color: 'rgba(40, 30, 50, 0.45)',
              }}
            >
              <Balloon color={COLORS[b.color]} />
            </span>
          ))}
          {pins.map((pin) => (
            <span
              key={pin.id}
              className={`bday-pin bday-pin--${pin.type}`}
              style={{
                transform: `translate3d(${pin.x}px, ${pin.y}px, 0)`,
                opacity: pin.show ? 1 : 0,
              }}
            >
              {pin.type === 'cake' ? (
                <Cake />
              ) : (
                <span className="bday-hat-tilt" style={{ '--bday-tilt': `${pin.tilt}deg` }}>
                  <Hat color={pin.color} />
                </span>
              )}
            </span>
          ))}
        </div>
      ) : null}
    </>
  )
}
