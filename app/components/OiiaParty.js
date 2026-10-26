'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { KittenFace, useKittenSeason } from './Kitten'
import { soundsMuted } from './softSounds'
import { useT } from './I18nProvider'

const START_EVENT = 'kitten-oiia'
const STATE_EVENT = 'kitten-oiia-state'
const MUSIC_URL = '/sounds/kekcheburek.weba'
const APPEAR_AT = 1
const CREW_AT = 30.3
const FINALE_AT = 32
const CHAOS_AT = 45
const SHATTER_AT = 40
const SHATTER_END = 57.5
const SHATTER_SELECTOR = 'nav *, main *, footer *'
const SMASH_PER_FRAME = 4
const SHATTER_ABOVE = 1.5
const OUTRO_RUN_MS = 1300
const OUTRO_REVEAL_MS = 2300
const OUTRO_END_MS = 3300
const DANCES = [
  [1, 3],
  [4.3, 6],
  [8, 9.5],
  [11, 13],
  [14.25, 28],
  [32, 59],
]
const SILENT_END = DANCES[DANCES.length - 1][1] + 1
const SPIN_SPEED = 1260
const SETTLE_SPEED = 1080
const DANCERS = [
  { speed: 1, dir: 1 },
  { speed: 1.25, dir: -1 },
  { speed: 0.8, dir: 1 },
]
const SIDEKICKS = [
  { side: -1, pose: 'wave', mood: 'happy', place: 'left-[4%] sm:left-[10%]' },
  { side: 1, pose: 'hips', mood: 'wink', place: 'right-[4%] sm:right-[10%]' },
]
const LIGHTS = [
  { left: '12%', color: 'rgba(255,72,160,0.55)', delay: 0 },
  { left: '38%', color: 'rgba(72,200,255,0.5)', delay: 0.15 },
  { left: '62%', color: 'rgba(255,214,72,0.5)', delay: 0.3 },
  { left: '88%', color: 'rgba(120,255,140,0.5)', delay: 0.45 },
]
const FINALE_LIGHTS = [
  { left: '25%', color: 'rgba(170,110,255,0.55)', delay: 0.07 },
  { left: '50%', color: 'rgba(255,120,72,0.5)', delay: 0.22 },
  { left: '75%', color: 'rgba(72,255,220,0.5)', delay: 0.37 },
  { left: '0%', color: 'rgba(255,255,140,0.45)', delay: 0.52 },
  { left: '100%', color: 'rgba(255,72,120,0.5)', delay: 0.6 },
]
const CONFETTI_COLORS = ['#ff4fa3', '#4fc3ff', '#ffd84f', '#7dff8a', '#b38bff', '#ff8a4f']
const WRECK_SELECTOR = 'main h1, main h2, main h3, main p, main img, main a, main button, nav a, nav button, footer h3, footer a, footer button'
const WRECK_LIMIT = 80

export const OIIA_TAPS = process.env.NODE_ENV === 'development' ? 5 : 15

let context = null
let track = null

const rand = (min, max) => min + Math.random() * (max - min)

export function startOiia() {
  window.dispatchEvent(new Event(START_EVENT))
}

export function onOiiaChange(listener) {
  const handler = (event) => listener(event.detail)
  window.addEventListener(STATE_EVENT, handler)
  return () => window.removeEventListener(STATE_EVENT, handler)
}

function audioContext() {
  const Context = window.AudioContext || window.webkitAudioContext
  if (!Context) return null
  if (!context) context = new Context()
  if (context.state === 'suspended') context.resume().catch(() => {})
  return context
}

function loadTrack(ctx) {
  if (!track) {
    track = fetch(MUSIC_URL)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.arrayBuffer()
      })
      .then((data) => ctx.decodeAudioData(data))
    track.catch(() => {
      track = null
    })
  }
  return track
}

const dancingAt = (time) => DANCES.some(([from, to]) => time >= from && time < to)

function tile([a, b, c, d]) {
  return Math.random() < 0.5
    ? [
        [a, b, c],
        [a, c, d],
      ]
    : [
        [a, b, d],
        [b, c, d],
      ]
}

function shatter(el, layer) {
  const rect = el.getBoundingClientRect()
  if (rect.width < 8 || rect.height < 8) return
  const style = getComputedStyle(el)
  let css = ''
  for (const name of style) css += `${name}:${style.getPropertyValue(name)};`
  css += `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;margin:0;box-sizing:border-box;transform:none;animation:none;transition:none;visibility:visible;opacity:1;pointer-events:none;`
  if (style.display === 'inline') css += 'display:inline-block;'
  const cols = Math.min(4, Math.max(1, Math.round(rect.width / 90)))
  const rows = Math.min(3, Math.max(1, Math.round(rect.height / 70)))
  const points = []
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const inside = col > 0 && col < cols && row > 0 && row < rows
      points.push([
        (col / cols) * rect.width + (inside ? rand(-0.3, 0.3) * (rect.width / cols) : 0),
        (row / rows) * rect.height + (inside ? rand(-0.3, 0.3) * (rect.height / rows) : 0),
      ])
    }
  }
  const at = (col, row) => points[row * (cols + 1) + col]
  const shards = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) shards.push(...tile([at(col, row), at(col + 1, row), at(col + 1, row + 1), at(col, row + 1)]))
  }
  const fallTo = window.innerHeight - rect.top + 80
  const stretch = Math.sqrt(Math.max(1, fallTo / window.innerHeight))
  shards.forEach((shard) => {
    const cx = (shard[0][0] + shard[1][0] + shard[2][0]) / 3
    const cy = (shard[0][1] + shard[1][1] + shard[2][1]) / 3
    const piece = el.cloneNode(true)
    piece.classList.remove('oiia-wreck', 'oiia-wreck-inline')
    piece.removeAttribute('id')
    piece.setAttribute('aria-hidden', 'true')
    piece.style.cssText = `${css}transform-origin:${cx}px ${cy}px;clip-path:polygon(${shard.map(([x, y]) => `${x}px ${y}px`).join(',')});`
    layer.appendChild(piece)
    const spread = (cx - rect.width / 2) * 0.6 + rand(-40, 40)
    const spin = rand(-260, 260)
    const fall = piece.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${spread * 0.35}px, ${-rand(20, 70)}px) rotate(${spin * 0.15}deg)`, opacity: 1, offset: 0.18 },
        { transform: `translate(${spread}px, ${fallTo}px) rotate(${spin}deg)`, opacity: 0.85 },
      ],
      { duration: rand(1100, 1700) * stretch, delay: rand(0, 90), easing: 'cubic-bezier(0.4, 0, 0.85, 0.55)', fill: 'forwards' },
    )
    fall.onfinish = () => piece.remove()
  })
  el.style.visibility = 'hidden'
}

function startShatter() {
  const layer = document.createElement('div')
  layer.className = 'oiia-shards'
  layer.setAttribute('aria-hidden', 'true')
  document.body.appendChild(layer)
  const screen = window.innerWidth * window.innerHeight
  const queue = []
  for (const el of document.querySelectorAll(SHATTER_SELECTOR)) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue
    const rect = el.getBoundingClientRect()
    const area = rect.width * rect.height
    if (rect.width < 6 || rect.height < 6 || area < 200 || area > screen * 0.6) continue
    if (rect.bottom < -window.innerHeight * SHATTER_ABOVE || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) continue
    queue.push({ el, order: area * rand(0.4, 1.6) })
  }
  queue.sort((a, b) => a.order - b.order)
  const broken = new Set()
  const smash = () => {
    while (queue.length) {
      const { el } = queue.shift()
      if (!el.isConnected || el.parentElement?.closest('[data-oiia-broken]')) continue
      broken.add(el)
      el.setAttribute('data-oiia-broken', '')
      shatter(el, layer)
      return true
    }
    return false
  }
  const restore = () => {
    layer.remove()
    const tops = [...broken].filter((el) => !el.parentElement?.closest('[data-oiia-broken]'))
    broken.forEach((el) => {
      el.style.removeProperty('visibility')
      el.removeAttribute('data-oiia-broken')
    })
    tops.forEach((el) => {
      el.animate(
        [
          { opacity: 0, transform: 'scale(0.6)' },
          { opacity: 1, transform: 'scale(1.06)', offset: 0.7 },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 520, delay: rand(0, 260), easing: 'ease-out', fill: 'backwards' },
      )
    })
  }
  return { smash, restore, size: queue.length }
}

function wreckPage() {
  const picked = []
  for (const el of document.querySelectorAll(WRECK_SELECTOR)) {
    if (picked.length >= WRECK_LIMIT) break
    const rect = el.getBoundingClientRect()
    if (rect.width < 8 || rect.bottom < 0 || rect.top > window.innerHeight) continue
    if (rect.width * rect.height > window.innerWidth * window.innerHeight * 0.25) continue
    if (picked.some((other) => other.contains(el) || el.contains(other))) continue
    picked.push(el)
  }
  picked.forEach((el) => {
    el.classList.add('oiia-wreck')
    if (getComputedStyle(el).display === 'inline') el.classList.add('oiia-wreck-inline')
    el.style.setProperty('--oiia-x', `${rand(-26, 26).toFixed(1)}px`)
    el.style.setProperty('--oiia-y', `${rand(6, 22).toFixed(1)}px`)
    el.style.setProperty('--oiia-r', `${rand(-14, 14).toFixed(1)}deg`)
    el.style.setProperty('--oiia-d', `${rand(0.35, 0.8).toFixed(2)}s`)
    el.style.setProperty('--oiia-delay', `${rand(-0.8, 0).toFixed(2)}s`)
  })
  const restore = () => {
    picked.forEach((el) => {
      el.classList.remove('oiia-wreck', 'oiia-wreck-inline')
      ;['--oiia-x', '--oiia-y', '--oiia-r', '--oiia-d', '--oiia-delay'].forEach((name) => el.style.removeProperty(name))
    })
  }
  return { picked, restore }
}

function Arms({ pose }) {
  if (pose === 'wave') {
    return (
      <>
        <path d="M6.6 6.2Q3.6 5.4 2.4 2" />
        <circle cx="2.2" cy="1.6" r="1.4" fill="currentColor" fillOpacity="0.2" />
        <path d="M17.4 6.8Q20.6 9 19.4 12.2" />
        <circle cx="19.3" cy="12.6" r="1.4" fill="currentColor" fillOpacity="0.2" />
      </>
    )
  }
  if (pose === 'hips') {
    return (
      <>
        <path d="M6.6 6.6Q2.8 8.4 5.4 11.6" />
        <circle cx="5.9" cy="11.8" r="1.4" fill="currentColor" fillOpacity="0.2" />
        <path d="M17.4 6.6Q21.2 8.4 18.6 11.6" />
        <circle cx="18.1" cy="11.8" r="1.4" fill="currentColor" fillOpacity="0.2" />
      </>
    )
  }
  return (
    <>
      <path d="M6.6 6.2Q3.6 5.4 2.4 2" />
      <path d="M17.4 6.2Q20.4 5.4 21.6 2" />
      <circle cx="2.2" cy="1.6" r="1.4" fill="currentColor" fillOpacity="0.2" />
      <circle cx="21.8" cy="1.6" r="1.4" fill="currentColor" fillOpacity="0.2" />
    </>
  )
}

function KittenBody({ pose }) {
  const spooky = useKittenSeason() === 'halloween'
  return (
    <svg className={`-mt-[25%] h-auto w-full overflow-visible ${spooky ? 'text-[#f08a24]' : 'text-modrinth-green'}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 22" aria-hidden>
      <path d="M17.6 15.5q5.4-.6 4.6-6.4-.3-2 1-2.6" className="oiia-tail" />
      {pose === 'hips' ? null : <Arms pose={pose} />}
      <ellipse cx="12" cy="11" rx="6.4" ry="8" className="fill-[#0f1a14]" />
      <ellipse cx="12" cy="11" rx="6.4" ry="8" fill="currentColor" fillOpacity="0.1" />
      <ellipse cx="12" cy="12" rx="3.4" ry="5" stroke="none" fill="currentColor" fillOpacity="0.2" />
      {pose === 'hips' ? <Arms pose={pose} /> : null}
      <ellipse cx="8.6" cy="19.6" rx="2.7" ry="1.4" className="fill-[#0f1a14]" />
      <ellipse cx="15.4" cy="19.6" rx="2.7" ry="1.4" className="fill-[#0f1a14]" />
    </svg>
  )
}

function Dancer({ spinRef, pose, mood, look, onClick, label, size }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`pointer-events-auto block outline-none ${size}`}
      initial={{ scaleY: 0.55 }}
      animate={{ scaleY: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 10, delay: 0.14 }}
      style={{ originY: 1 }}
    >
      <span ref={spinRef} className="flex flex-col items-center [transform-style:preserve-3d]">
        <span className="relative z-10 w-full">
          <KittenFace mood={mood} look={look} className="h-auto w-full" />
        </span>
        <KittenBody pose={pose} />
      </span>
    </motion.button>
  )
}

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 36 }, (_, index) => ({
      id: index,
      left: `${rand(0, 100).toFixed(1)}%`,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      width: rand(6, 11),
      height: rand(10, 18),
      duration: `${rand(2.2, 4.2).toFixed(2)}s`,
      delay: `${rand(-4, 0).toFixed(2)}s`,
      spin: `${Math.round(rand(360, 1080)) * (index % 2 ? 1 : -1)}deg`,
    })),
  )
  return pieces.map((piece) => (
    <span
      key={piece.id}
      aria-hidden
      className="oiia-confetti absolute -top-6 rounded-[3px]"
      style={{ left: piece.left, width: piece.width, height: piece.height, background: piece.color, animationDuration: piece.duration, animationDelay: piece.delay, '--oiia-spin': piece.spin }}
    />
  ))
}

export default function OiiaParty() {
  const t = useT()
  const [phase, setPhase] = useState(null)
  const [loud, setLoud] = useState(false)
  const [crew, setCrew] = useState(false)
  const [finale, setFinale] = useState(false)
  const [outro, setOutro] = useState(null)
  const [runDir, setRunDir] = useState(1)
  const [mounted, setMounted] = useState(false)
  const spinRefs = [useRef(null), useRef(null), useRef(null)]
  const spinList = useRef(spinRefs)
  const run = useRef(null)
  const timers = useRef([])
  const live = useRef(false)
  const phaseRef = useRef(null)
  const pendingRestore = useRef(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const stop = useCallback(() => {
    if (!live.current) return
    live.current = false
    timers.current.forEach(clearTimeout)
    timers.current = []
    const current = run.current
    run.current = null
    document.documentElement.classList.remove('oiia', 'oiia-finale', 'oiia-chaos')
    setLoud(false)
    setFinale(false)
    if (current) {
      cancelAnimationFrame(current.frame)
      current.wreck?.restore()
      if (current.source) {
        current.source.onended = null
        try {
          current.source.stop()
        } catch {}
      }
      current.angles?.forEach((angle, index) => {
        const el = spinList.current[index].current
        if (!el) return
        el.style.transition = 'transform 0.45s ease-out'
        el.style.transform = `rotateY(${Math.round(angle / 360) * 360 * DANCERS[index].dir}deg)`
      })
    }
    const restore = () => {
      pendingRestore.current = null
      current?.shards?.restore()
    }
    if (phaseRef.current !== 'party') {
      restore()
      setCrew(false)
      setPhase(null)
      return
    }
    pendingRestore.current = restore
    const later = (ms, action) => timers.current.push(setTimeout(action, ms))
    setRunDir(Math.random() < 0.5 ? -1 : 1)
    setOutro('dim')
    setPhase('outro')
    later(OUTRO_RUN_MS, () => setOutro('run'))
    later(OUTRO_REVEAL_MS, () => {
      restore()
      setOutro('reveal')
    })
    later(OUTRO_END_MS, () => {
      setPhase(null)
      setOutro(null)
      setCrew(false)
    })
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const dance = (source, clock, end) => {
      const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0.25 : 1
      const state = { angles: DANCERS.map(() => 0), last: performance.now(), loud: false, shown: false, crew: false, finale: false, chaos: false, smashed: 0, total: 0 }
      run.current = { source, frame: 0, wreck: null, shards: null, angles: state.angles }
      const tick = (now) => {
        if (!live.current || !run.current) return
        const dt = Math.min(0.05, (now - state.last) / 1000)
        state.last = now
        const time = clock()
        if (end && time >= end) {
          stop()
          return
        }
        if (!state.shown && time >= APPEAR_AT) {
          state.shown = true
          setPhase('party')
        }
        if (!state.crew && time >= CREW_AT) {
          state.crew = true
          setCrew(true)
        }
        if (!state.finale && time >= FINALE_AT) {
          state.finale = true
          setFinale(true)
          root.classList.add('oiia-finale')
          if (calm === 1) run.current.wreck = wreckPage()
        }
        if (!state.chaos && time >= CHAOS_AT) {
          state.chaos = true
          root.classList.add('oiia-chaos')
        }
        if (run.current.wreck && time >= SHATTER_AT) {
          if (!run.current.shards) {
            run.current.shards = startShatter()
            state.total = run.current.shards.size
          }
          const progress = Math.min(1, (time - SHATTER_AT) / (SHATTER_END - SHATTER_AT))
          const target = Math.ceil(state.total * progress * progress)
          for (let step = 0; step < SMASH_PER_FRAME && state.smashed < target; step++) {
            state.smashed += 1
            if (!run.current.shards.smash()) state.smashed = state.total
          }
        }
        const noisy = dancingAt(time)
        if (noisy !== state.loud) {
          state.loud = noisy
          root.classList.toggle('oiia', noisy)
          setLoud(noisy)
        }
        DANCERS.forEach((dancer, index) => {
          const active = noisy && (index === 0 || state.crew)
          const angle = state.angles[index]
          state.angles[index] = active
            ? angle + SPIN_SPEED * dancer.speed * calm * dt
            : Math.min(Math.ceil(angle / 360) * 360, angle + SETTLE_SPEED * dt)
          const el = spinList.current[index].current
          if (el) el.style.transform = `rotateY(${state.angles[index] * dancer.dir}deg)`
        })
        run.current.frame = requestAnimationFrame(tick)
      }
      run.current.frame = requestAnimationFrame(tick)
    }

    const silently = () => {
      if (!live.current) return
      const startAt = performance.now()
      dance(null, () => (performance.now() - startAt) / 1000, SILENT_END)
    }

    const begin = () => {
      if (live.current || phaseRef.current) return
      live.current = true
      phaseRef.current = 'intro'
      timers.current.forEach(clearTimeout)
      timers.current = []
      spinList.current.forEach((ref) => ref.current?.style.removeProperty('transition'))
      setPhase('intro')
      const ctx = audioContext()
      if (!ctx) {
        silently()
        return
      }
      loadTrack(ctx)
        .then((buffer) => {
          if (!live.current) return
          if (ctx.state !== 'running') throw new Error('audio locked')
          const source = ctx.createBufferSource()
          const gain = ctx.createGain()
          gain.gain.value = soundsMuted() ? 0 : 0.7
          source.buffer = buffer
          source.connect(gain).connect(ctx.destination)
          source.onended = stop
          const startAt = ctx.currentTime + 0.05
          source.start(startAt)
          dance(source, () => ctx.currentTime - startAt, 0)
        })
        .catch(silently)
    }
    window.addEventListener(START_EVENT, begin)
    return () => {
      window.removeEventListener(START_EVENT, begin)
      stop()
      timers.current.forEach(clearTimeout)
      pendingRestore.current?.()
    }
  }, [stop])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: phase !== null }))
  }, [phase])

  useEffect(() => {
    if (phase !== 'intro' && phase !== 'party') return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') stop()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, stop])

  if (!mounted) return null

  const shown = phase === 'party' || phase === 'outro'
  const running = outro === 'run' || outro === 'reveal'
  const dark = outro === 'dim' || outro === 'run'
  const label = t('account.petKitten')
  const hop = { y: [0, -22, 0, -22, 0, -22, 0], transition: { x: { duration: 1, ease: 'easeIn' }, y: { duration: 1, ease: 'easeInOut' }, rotate: { duration: 0.3 } } }
  const mainMood = outro ? (running ? 'happy' : 'look') : loud ? 'happy' : 'look'

  return createPortal(
    <AnimatePresence>
      {shown ? (
        <motion.div
          key="oiia"
          className="pointer-events-none fixed inset-0 z-[2147483000] overflow-hidden"
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
          {phase === 'outro' ? (
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-[#05070a]"
              initial={{ opacity: 0 }}
              animate={{ opacity: dark ? 0.94 : 0 }}
              transition={{ duration: dark ? 0.7 : 0.9, ease: 'easeInOut' }}
            />
          ) : null}
          {phase === 'party' && loud
            ? (finale ? [...LIGHTS, ...FINALE_LIGHTS] : LIGHTS).map((light) => (
                <span
                  key={light.left}
                  aria-hidden
                  className="oiia-light absolute -top-1/3 h-[140%] w-[34vw] -translate-x-1/2"
                  style={{ left: light.left, background: `radial-gradient(ellipse at top, ${light.color}, transparent 70%)`, animationDelay: `${light.delay}s` }}
                />
              ))
            : null}
          {phase === 'party' && finale ? <Confetti /> : null}
          <motion.span
            aria-hidden
            className="absolute bottom-[calc(22vh+5.5rem)] left-[-10vw] h-1 w-[120vw] origin-left rounded-full bg-white shadow-[0_0_18px_6px_rgba(255,255,255,0.7)]"
            initial={{ scaleX: 0, opacity: 1, rotate: -8 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{ scaleX: { duration: 0.16, ease: 'easeOut' }, opacity: { duration: 0.45, delay: 0.12 } }}
          />
          {crew
            ? SIDEKICKS.map((kick, index) => (
                <motion.div
                  key={kick.pose}
                  className={`absolute bottom-[16vh] [perspective:600px] ${kick.place}`}
                  initial={{ x: `${kick.side * 60}vw`, y: '-60vh', rotate: kick.side * 540 }}
                  animate={running ? { x: `${kick.side * 70}vw`, rotate: kick.side * 8, ...hop } : { x: 0, y: 0, rotate: 0 }}
                  transition={{ duration: 0.75, ease: [0.25, 0.8, 0.35, 1], delay: index * 0.35 }}
                >
                  <Dancer
                    spinRef={spinRefs[index + 1]}
                    pose={kick.pose}
                    mood={outro ? (running ? 'happy' : 'look') : loud ? 'happy' : kick.mood}
                    look={outro ? { x: kick.side * 0.9, y: 0 } : { x: -kick.side * 0.8, y: 0.2 }}
                    onClick={stop}
                    label={label}
                    size="w-[4.5rem] sm:w-20"
                  />
                </motion.div>
              ))
            : null}
          <motion.div
            className="absolute bottom-[22vh] left-1/2 -ml-14 [perspective:600px]"
            initial={{ x: '-70vw', skewX: -28 }}
            animate={running ? { x: `${runDir * 85}vw`, skewX: 0, rotate: runDir * 6, ...hop } : { x: 0, skewX: 0 }}
            transition={{ x: { duration: 0.16, ease: [0.2, 0.9, 0.3, 1] }, skewX: { type: 'spring', stiffness: 500, damping: 14, delay: 0.12 } }}
          >
            <Dancer
              spinRef={spinRefs[0]}
              pose="up"
              mood={mainMood}
              look={outro ? { x: runDir * 0.9, y: 0 } : undefined}
              onClick={stop}
              label={label}
              size="w-28"
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
