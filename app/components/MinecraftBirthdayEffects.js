'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DIAMOND_MILESTONE, isMinecraftBirthdaySeason, minecraftAge, minecraftBirthdayPhase } from '@/lib/minecraftBirthday'
import { festiveBook } from '@/lib/festiveScoreClient'
import { useT } from './I18nProvider'
import { playChime, playDing } from './softSounds'
import PagePinsLayer, { headingSpot, pinCards, usePagePins } from './PagePins'
import PixelDiamond from './PixelDiamond'
import useCandle from './useCandle'

const BITS = Array.from({ length: 24 }, (_, i) => ({
  left: ((i * 23) % 100) + (i % 4) * 0.5,
  delay: -((i * 2.7) % 11),
  duration: 9 + (i % 6) * 1.3,
  size: 7 + (i % 4) * 2,
  rot: (i * 53) % 360,
  kind: ['grass', 'dirt', 'stone', 'diamond', 'gold', 'leaves', 'wood', 'emerald'][i % 8],
}))

const DIAMOND_PACE = { max: 4, every: 1500, first: 900 }

function collectPins(base) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return []
  const out = []
  const spot = headingSpot(40, 36)
  if (spot) {
    out.push({
      id: 'mcb-cake',
      type: 'cake',
      x: spot.x - base.x,
      y: spot.y - base.y,
      show: true,
    })
  }
  const kinds = ['grass', 'diamond', 'grass']
  pinCards(3).forEach((r, i) => {
    const right = i % 2 === 0
    const kind = kinds[i]
    const size = kind === 'grass' ? 30 : 22
    out.push({
      id: `mcb-${kind}-${i}`,
      type: kind,
      x: (right ? r.right - size - 12 : r.left + 12) - base.x,
      y: r.top - size * 0.62 - base.y,
      w: size,
      h: size,
      show: true,
      delay: `${-i * 0.9}s`,
    })
  })
  return out
}

function PixelCake({ lit = false }) {
  return (
    <svg viewBox="0 0 20 18" className={`mcb-cake${lit ? ' mcb-cake--lit' : ''}`} shapeRendering="crispEdges" aria-hidden>
      {lit ? (
        <g className="mcb-flame">
          <rect x="9" y="-1" width="2" height="3" fill="#ffd34d" />
          <rect x="9.5" y="-2" width="1" height="1" fill="#fff3b0" />
          <rect x="9" y="1" width="2" height="1" fill="#ff9a2e" />
        </g>
      ) : (
        <rect x="9.6" y="1" width="0.8" height="1" fill="#3a2a1a" />
      )}
      <rect x="9" y="2" width="2" height="5" fill="#6cc4ff" />
      <rect x="9" y="3" width="2" height="1" fill="#ffffff" opacity="0.7" />
      <rect x="2" y="7" width="16" height="4" fill="#f7f2ea" />
      <rect x="2" y="11" width="16" height="6" fill="#c9824a" />
      <rect x="2" y="11" width="16" height="1" fill="#e0a26b" />
      <rect x="2" y="16" width="16" height="1" fill="#9c5e30" />
      <rect x="3" y="11" width="2" height="2" fill="#f7f2ea" />
      <rect x="8" y="11" width="1" height="2" fill="#f7f2ea" />
      <rect x="13" y="11" width="2" height="1" fill="#f7f2ea" />
      <rect x="16" y="11" width="1" height="2" fill="#f7f2ea" />
      <rect x="4" y="8" width="1" height="1" fill="#e2373a" />
      <rect x="7" y="9" width="1" height="1" fill="#e2373a" />
      <rect x="12" y="8" width="1" height="1" fill="#e2373a" />
      <rect x="15" y="9" width="1" height="1" fill="#e2373a" />
      <rect x="5" y="14" width="1" height="1" fill="#8f5228" />
      <rect x="11" y="13" width="1" height="1" fill="#8f5228" />
      <rect x="14" y="15" width="1" height="1" fill="#8f5228" />
    </svg>
  )
}

function CakeButton({ className }) {
  const [lit, light] = useCandle()
  return (
    <button type="button" tabIndex={-1} aria-hidden className={className} onPointerDown={light}>
      <PixelCake lit={lit} />
    </button>
  )
}

function GrassBlock() {
  return (
    <svg viewBox="0 0 32 32" className="mcb-block" aria-hidden>
      <polygon points="16,2 30,9 16,16 2,9" fill="#7cc04b" />
      <polygon points="2,9 16,16 16,30 2,23" fill="#8b5a2b" />
      <polygon points="16,16 30,9 30,23 16,30" fill="#6b4220" />
      <polygon points="2,9 16,16 16,19.5 2,12.5" fill="#5fa336" />
      <polygon points="16,16 30,9 30,12.5 16,19.5" fill="#4d8a2a" />
      <polygon points="9,5.5 12,4 15,5.5 12,7" fill="#94d65f" />
      <polygon points="18,10 21,8.5 24,10 21,11.5" fill="#94d65f" />
      <rect x="6" y="18" width="2" height="2" fill="#a6713d" />
      <rect x="11" y="23" width="2" height="2" fill="#6f4520" />
      <rect x="21" y="20" width="2" height="2" fill="#583518" />
      <rect x="25" y="16" width="2" height="2" fill="#7d5028" />
    </svg>
  )
}

function Diamond() {
  return <PixelDiamond className="mcb-gem" />
}

function DiamondScore({ count, bump, t }) {
  return (
    <span className={`mcb-score${bump ? ' mcb-score--up' : ''}`} title={t('mcbday.scoreTitle')}>
      <span className="mcb-score-gem">
        <Diamond />
      </span>
      <span className="mcb-score-count">{count}</span>
    </span>
  )
}

function MinecraftBanner({ phase, count, bump }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const age = minecraftAge()

  useEffect(() => {
    try {
      if (sessionStorage.getItem('mcbdayBannerOff') === '1') return
    } catch {}
    setOpen(true)
  }, [])

  if (!open) return null

  return (
    <div className="mcb-banner" role="status">
      <CakeButton className="mcb-banner-cake mcb-cake-btn" />
      <div className="mcb-banner-copy">
        <p className="mcb-banner-title">{t(`mcbday.${phase}Title`, { age })}</p>
        <p className="mcb-banner-text">{t('mcbday.banner')}</p>
        <p className="mcb-banner-play">{t('mcbday.play')}</p>
      </div>
      <DiamondScore count={count} bump={bump} t={t} />
      <button
        type="button"
        className="mcb-banner-close"
        aria-label={t('mcbday.close')}
        onClick={() => {
          try {
            sessionStorage.setItem('mcbdayBannerOff', '1')
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

function spawnDiamond(id) {
  return {
    id,
    left: 6 + Math.random() * 88,
    duration: 7 + Math.random() * 4,
    size: 30 + Math.round(Math.random() * 14),
    drift: `${(Math.random() * 2 - 1) * 50}px`,
    sway: 1.8 + Math.random() * 1.2,
    got: false,
  }
}

function DiamondGame({ onCollect }) {
  const [diamonds, setDiamonds] = useState([])
  const seq = useRef(0)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return undefined
    const tick = () => {
      setDiamonds((list) => {
        if (list.filter((gem) => !gem.got).length >= DIAMOND_PACE.max) return list
        seq.current += 1
        return [...list, spawnDiamond(seq.current)]
      })
    }
    const first = window.setTimeout(tick, DIAMOND_PACE.first)
    const id = window.setInterval(tick, DIAMOND_PACE.every)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [])

  const remove = (id) => setDiamonds((list) => list.filter((gem) => gem.id !== id))

  const collect = (gem, event) => {
    event.preventDefault()
    event.stopPropagation()
    if (gem.got) return
    onCollect()
    setDiamonds((list) => list.map((item) => (item.id === gem.id ? { ...item, got: true } : item)))
    window.setTimeout(() => remove(gem.id), 420)
  }

  return (
    <div className="mcb-game">
      {diamonds.map((gem) => (
        <button
          key={gem.id}
          type="button"
          tabIndex={-1}
          aria-hidden
          className={`mcb-diamond${gem.got ? ' mcb-diamond--got' : ''}`}
          style={{
            left: `${gem.left}%`,
            width: gem.size,
            animationDuration: `${gem.duration}s`,
            '--mcb-drift': gem.drift,
          }}
          onPointerDown={(event) => collect(gem, event)}
          onAnimationEnd={(event) => {
            if (event.animationName === 'mcb-drop') remove(gem.id)
          }}
        >
          <span className="mcb-diamond-body" style={{ animationDuration: `${gem.sway}s` }}>
            <Diamond />
          </span>
          {gem.got ? (
            <span className="mcb-sparks">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} style={{ '--mcb-spark': `${i * 60}deg` }} />
              ))}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

function Pin({ pin }) {
  if (pin.type === 'cake') return <CakeButton className="mcb-cake-btn" />
  if (pin.type === 'diamond') return <Diamond />
  return <GrassBlock />
}

export default function MinecraftBirthdayEffects() {
  const pathname = usePathname()
  const [phase, setPhase] = useState(null)
  const [count, setCount] = useState(0)
  const [bump, setBump] = useState(false)
  const milestoneRef = useRef(null)
  const collectedAtRef = useRef(0)
  const { layerRef, pins } = usePagePins(collectPins, { enabled: Boolean(phase), pathname })

  useLayoutEffect(() => {
    const apply = () => setCount(festiveBook.shown('diamonds'))
    apply()
    return festiveBook.subscribe(apply)
  }, [])

  useEffect(() => {
    if (isMinecraftBirthdaySeason()) setPhase(minecraftBirthdayPhase())
  }, [])

  useEffect(() => {
    const milestone = Math.floor(count / DIAMOND_MILESTONE)
    const byHand = Date.now() - collectedAtRef.current < 1000
    if (milestoneRef.current !== null && milestone > milestoneRef.current && byHand) {
      playChime()
      setBump(true)
      const id = window.setTimeout(() => setBump(false), 900)
      milestoneRef.current = milestone
      return () => window.clearTimeout(id)
    }
    milestoneRef.current = milestone
    return undefined
  }, [count])

  if (!phase) return null

  return (
    <>
      <MinecraftBanner phase={phase} count={count} bump={bump} />
      <DiamondGame
        onCollect={() => {
          collectedAtRef.current = Date.now()
          playDing()
          festiveBook.catch('diamonds')
        }}
      />
      <div className="mcb-layer" aria-hidden>
        {BITS.map((bit, i) => (
          <span
            key={i}
            className={`mcb-bit mcb-bit--${bit.kind}`}
            style={{
              left: `${bit.left}%`,
              width: bit.size,
              height: bit.size,
              animationDelay: `${bit.delay}s`,
              animationDuration: `${bit.duration}s`,
              '--mcb-rot': `${bit.rot}deg`,
            }}
          />
        ))}
      </div>
      <PagePinsLayer layerRef={layerRef}>
        {pins.map((pin) => (
          <span
            key={pin.id}
            className={`mcb-pin mcb-pin--${pin.type}`}
            style={{
              transform: `translate3d(${pin.x}px, ${pin.y}px, 0)`,
              opacity: pin.show ? 1 : 0,
            }}
          >
            <span className="mcb-pin-bob" style={{ animationDelay: pin.delay }}>
              <Pin pin={pin} />
            </span>
          </span>
        ))}
      </PagePinsLayer>
    </>
  )
}
