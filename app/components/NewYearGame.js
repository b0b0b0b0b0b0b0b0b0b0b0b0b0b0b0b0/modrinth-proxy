'use client'

import { useEffect, useRef, useState } from 'react'
import { onSnowTurboChange, readSnowTurbo, readTree, writeTree } from '@/lib/newYear'
import { useT } from './I18nProvider'
import { playChime, playPop, playTrill } from './softSounds'

const BALL_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#10b981']
const KIND_STAR = 5
const KIND_CANDY = 6
const KIND_WEIGHTS = [3, 3, 3, 3, 3, 2, 2]
const GARLAND_AT = 10
const STAR_AT = 25
const SALUTE_EVERY = 50

const SLOTS = [
  [30, 43], [17, 37], [35, 20], [41, 52], [22, 30], [14, 54], [43, 37], [30, 13],
  [23, 52], [38, 30], [48, 55], [30, 36], [25, 20], [32, 55], [22, 45], [30, 27],
  [38, 45], [8, 57],
]

const LIGHTS = [
  [19, 22], [24, 23.6], [30, 24], [36, 23], [40, 21],
  [16, 36], [22, 38.4], [30, 39], [38, 38], [44, 35.5],
  [12, 51], [19, 54], [30, 55], [41, 53.8], [50, 50.5],
]
const LIGHT_COLORS = ['#fde047', '#f472b6', '#60a5fa', '#4ade80', '#fb923c']

const PACE = {
  calm: { max: 3, every: 2400, first: 1500, duration: [10, 4] },
  turbo: { max: 5, every: 1100, first: 500, duration: [7, 3] },
}

function pickKind() {
  const total = KIND_WEIGHTS.reduce((sum, weight) => sum + weight, 0)
  let roll = Math.random() * total
  for (let kind = 0; kind < KIND_WEIGHTS.length; kind += 1) {
    roll -= KIND_WEIGHTS[kind]
    if (roll < 0) return kind
  }
  return 0
}

function starPoints(outer, inner) {
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    return `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`
  }).join(' ')
}

function Ornament({ kind }) {
  if (kind === KIND_STAR) {
    return <polygon points={starPoints(11.5, 4.8)} fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round" />
  }
  if (kind === KIND_CANDY) {
    return (
      <g fill="none" strokeLinecap="round">
        <path d="M3 11V-3a5 5 0 0 0-10 0" stroke="white" strokeWidth="5" />
        <path d="M3 11V-3a5 5 0 0 0-10 0" stroke="#ef4444" strokeWidth="5" strokeDasharray="3.2 3.2" />
      </g>
    )
  }
  return (
    <g>
      <rect x="-2.6" y="-12.6" width="5.2" height="3.8" rx="1" fill="#fbbf24" />
      <circle r="10" fill={BALL_COLORS[kind] || BALL_COLORS[0]} />
      <ellipse cx="-3.6" cy="-3.6" rx="3.2" ry="2.1" fill="white" opacity="0.55" />
    </g>
  )
}

function spawnToy(id, pace) {
  return {
    id,
    kind: pickKind(),
    left: 6 + Math.random() * 86,
    size: 40 + Math.round(Math.random() * 14),
    duration: pace.duration[0] + Math.random() * pace.duration[1],
    sway: 2.6 + Math.random() * 1.4,
    caught: false,
  }
}

function Tree({ tree, fresh, treeRef, salute }) {
  const lit = tree.total >= GARLAND_AT
  const starred = tree.total >= STAR_AT
  return (
    <span className="ny-tree-wrap">
      <svg ref={treeRef} className="ny-tree" viewBox="0 -4 60 72" aria-hidden>
        <rect x="26" y="59" width="8" height="7" rx="1.5" fill="#92400e" />
        <path d="M30 30 56 60H4Z" fill="#15803d" />
        <path d="M30 16 50 40H10Z" fill="#16a34a" />
        <path d="M30 4 44 24H16Z" fill="#22c55e" />
        <g fill="none" stroke={lit ? '#fde68a' : 'rgba(255,255,255,0.25)'} strokeWidth="0.7">
          <path d="M17 21Q30 26 41 20" />
          <path d="M14 35Q30 41 46 34" />
          <path d="M10 50Q30 58 52 49" />
        </g>
        {LIGHTS.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={lit ? 1.25 : 0.9}
            className={lit ? 'ny-light' : undefined}
            fill={lit ? LIGHT_COLORS[i % LIGHT_COLORS.length] : 'rgba(255,255,255,0.3)'}
            style={lit ? { animationDelay: `${(i % 5) * 0.28}s` } : undefined}
          />
        ))}
        {tree.hung.slice(0, SLOTS.length).map((kind, i) => (
          <g key={i} transform={`translate(${SLOTS[i][0]} ${SLOTS[i][1]}) scale(0.24)`}>
            <g className={i === fresh ? 'ny-hang' : undefined}>
              <Ornament kind={kind} />
            </g>
          </g>
        ))}
        {starred ? (
          <g transform="translate(30 2.5)">
            <g className="ny-star">
              <polygon points={starPoints(5.4, 2.3)} fill="#fde047" stroke="#f59e0b" strokeWidth="0.6" strokeLinejoin="round" />
            </g>
          </g>
        ) : null}
      </svg>
      {salute ? (
        <span key={salute} className="ny-salute" aria-hidden>
          {[0, 1, 2].map((burst) => (
            <span key={burst} className="ny-burst" style={{ '--ny-bx': `${[-18, 16, 0][burst]}px`, '--ny-by': `${[-6, -12, -26][burst]}px`, animationDelay: `${burst * 0.18}s` }}>
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} style={{ '--ny-ray': `${i * 45}deg`, background: LIGHT_COLORS[(i + burst) % LIGHT_COLORS.length], animationDelay: `${burst * 0.18}s` }} />
              ))}
            </span>
          ))}
        </span>
      ) : null}
    </span>
  )
}

function Banner({ tree, fresh, treeRef, salute, onClose }) {
  const t = useT()
  const hint =
    tree.total < GARLAND_AT
      ? t('newyear.toGarland', { n: GARLAND_AT - tree.total })
      : tree.total < STAR_AT
        ? t('newyear.toStar', { n: STAR_AT - tree.total })
        : tree.total < SALUTE_EVERY
          ? t('newyear.toSalute', { n: SALUTE_EVERY - tree.total })
          : t('newyear.done')
  return (
    <div className="ny-banner" role="status">
      <Tree tree={tree} fresh={fresh} treeRef={treeRef} salute={salute} />
      <div className="ny-banner-copy">
        <p className="ny-banner-title">{t('newyear.title')}</p>
        <p className="ny-banner-play">{t('newyear.play')}</p>
        <p className="ny-banner-hint">{hint}</p>
      </div>
      <span className="ny-banner-score" title={t('newyear.scoreTitle')}>
        <svg viewBox="-13 -14 26 26" className="ny-banner-ball" aria-hidden>
          <Ornament kind={0} />
        </svg>
        {tree.total}
      </span>
      <button type="button" className="ny-banner-close" aria-label={t('newyear.close')} onClick={onClose}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function NewYearGame() {
  const [enabled, setEnabled] = useState(false)
  const [toys, setToys] = useState([])
  const [flights, setFlights] = useState([])
  const [tree, setTree] = useState({ total: 0, hung: [] })
  const [fresh, setFresh] = useState(-1)
  const [salute, setSalute] = useState(0)
  const [banner, setBanner] = useState(false)
  const [turbo, setTurbo] = useState(false)
  const treeRef = useRef(null)
  const treeData = useRef({ total: 0, hung: [] })
  const flying = useRef(0)
  const seq = useRef(0)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    treeData.current = readTree()
    setTree(treeData.current)
    setTurbo(readSnowTurbo())
    try {
      setBanner(sessionStorage.getItem('nyTreeBannerOff') !== '1')
    } catch {
      setBanner(true)
    }
    setEnabled(true)
    return onSnowTurboChange(setTurbo)
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    const pace = turbo ? PACE.turbo : PACE.calm
    const tick = () => {
      setToys((list) => {
        if (list.filter((toy) => !toy.caught).length >= pace.max) return list
        seq.current += 1
        return [...list, spawnToy(seq.current, pace)]
      })
    }
    const first = window.setTimeout(tick, pace.first)
    const id = window.setInterval(tick, pace.every)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [enabled, turbo])

  const hang = (kind) => {
    const current = treeData.current
    const total = current.total + 1
    const hung = current.hung.length < SLOTS.length ? [...current.hung, kind] : current.hung
    const next = { total, hung }
    treeData.current = next
    writeTree(next)
    setTree(next)
    if (hung.length !== current.hung.length) setFresh(hung.length - 1)
    if (total === GARLAND_AT || total === STAR_AT) window.setTimeout(playChime, 160)
    if (total % SALUTE_EVERY === 0) {
      setSalute(total)
      ;[0, 160, 320].forEach((delay) => window.setTimeout(playPop, 150 + delay))
      window.setTimeout(playTrill, 700)
    }
  }

  const target = (slot) => {
    const svg = treeRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    if (!rect.width) return null
    const [x, y] = slot < SLOTS.length ? SLOTS[slot] : [30, 34]
    return {
      x: rect.left + (x / 60) * rect.width,
      y: rect.top + ((y + 4) / 72) * rect.height,
      scale: ((rect.width / 60) * 2.4) / 10,
    }
  }

  const caught = (toy, event) => {
    event.preventDefault()
    event.stopPropagation()
    if (toy.caught) return
    playPop()
    const body = event.currentTarget.querySelector('.ny-toy-ball')?.getBoundingClientRect()
    setToys((list) => list.map((item) => (item.id === toy.id ? { ...item, caught: true } : item)))
    window.setTimeout(() => setToys((list) => list.filter((item) => item.id !== toy.id)), 700)
    const to = banner && body ? target(treeData.current.hung.length + flying.current) : null
    if (!to) {
      hang(toy.kind)
      return
    }
    flying.current += 1
    setFlights((list) => [
      ...list,
      {
        id: toy.id,
        kind: toy.kind,
        x: body.left + body.width / 2,
        y: body.top + body.height / 2,
        dx: to.x - (body.left + body.width / 2),
        dy: to.y - (body.top + body.height / 2),
        scale: to.scale,
      },
    ])
  }

  const land = (flight) => {
    flying.current = Math.max(0, flying.current - 1)
    setFlights((list) => list.filter((item) => item.id !== flight.id))
    playChime()
    hang(flight.kind)
  }

  if (!enabled) return null

  return (
    <>
      {banner ? (
        <Banner
          tree={tree}
          fresh={fresh}
          treeRef={treeRef}
          salute={salute}
          onClose={() => {
            try {
              sessionStorage.setItem('nyTreeBannerOff', '1')
            } catch {}
            flights.forEach((flight) => hang(flight.kind))
            flying.current = 0
            setFlights([])
            setBanner(false)
          }}
        />
      ) : null}
      <div className="ny-game">
        {toys.map((toy) => (
          <button
            key={toy.id}
            type="button"
            tabIndex={-1}
            aria-hidden
            className={`ny-toy${toy.caught ? ' ny-toy--caught' : ''}`}
            style={{ left: `${toy.left}%`, width: toy.size, animationDuration: `${toy.duration}s` }}
            onPointerDown={(event) => caught(toy, event)}
            onAnimationEnd={(event) => {
              if (event.animationName === 'ny-toy-fall') setToys((list) => list.filter((item) => item.id !== toy.id))
            }}
          >
            <span className="ny-toy-swing" style={{ animationDuration: `${toy.sway}s` }}>
              <svg viewBox="-17 -35 34 48" aria-hidden>
                <g className="ny-toy-chute">
                  <path
                    d="M-14 -20Q-14 -33 0 -33Q14 -33 14 -20Q10.5 -23 7 -20Q3.5 -23 0 -20Q-3.5 -23 -7 -20Q-10.5 -23 -14 -20Z"
                    fill="#e0f2fe"
                    stroke="#7dd3fc"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                  <path d="M-7 -32Q-6 -26 -7 -20M7 -32Q6 -26 7 -20" fill="none" stroke="#bae6fd" strokeWidth="1.2" />
                  <path d="M-14 -20 0 -12M0 -20V-12M14 -20 0 -12" stroke="#94a3b8" strokeWidth="0.7" />
                </g>
                <g className="ny-toy-ball">
                  <Ornament kind={toy.kind} />
                </g>
              </svg>
            </span>
          </button>
        ))}
      </div>
      {flights.map((flight) => (
        <span
          key={flight.id}
          className="ny-flight"
          style={{ left: flight.x, top: flight.y, '--ny-dx': `${flight.dx}px` }}
          onAnimationEnd={(event) => {
            if (event.animationName === 'ny-fly-x') land(flight)
          }}
          aria-hidden
        >
          <span className="ny-flight-y" style={{ '--ny-dy': `${flight.dy}px`, '--ny-scale': flight.scale }}>
            <svg viewBox="-13 -14 26 26">
              <Ornament kind={flight.kind} />
            </svg>
          </span>
        </span>
      ))}
    </>
  )
}
