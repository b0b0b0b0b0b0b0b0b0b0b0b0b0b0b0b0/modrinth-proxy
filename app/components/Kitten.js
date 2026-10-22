'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { isHalloweenSeason } from '@/lib/halloween'
import { isNewYearSeason } from '@/lib/newYear'

const HEART_PATH =
  'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z'
const EARS = [
  { side: -1, outer: 'M5.7 5.6 5 0.9 10.1 3.2', inner: 'M6.6 5 6.3 2.6 8.8 3.7Z', origin: '8px 4.5px' },
  { side: 1, outer: 'M18.3 5.6 19 0.9 13.9 3.2', inner: 'M17.4 5 17.7 2.6 15.2 3.7Z', origin: '16px 4.5px' },
]

const BAT_PATH =
  'M12 8.6c.5-.9 1.4-1.3 2.1-1l-.3 1.2c1.6-.3 3.4.2 4.7 1.5.9.9 2 1.4 3.4 1.4-1.2 1.2-3 1.4-4.3.9.2 1.3-.4 2.6-1.4 3.4-.4-1.2-1.4-2-2.6-2.2L12 16.2l-1.6-2.4c-1.2.2-2.2 1-2.6 2.2-1-.8-1.6-2.1-1.4-3.4-1.3.5-3.1.3-4.3-.9 1.4 0 2.5-.5 3.4-1.4 1.3-1.3 3.1-1.8 4.7-1.5l-.3-1.2c.7-.3 1.6.1 2.1 1Z'

const random = (min, max) => min + Math.random() * (max - min)

export function useKittenSeason() {
  const [season, setSeason] = useState(null)
  useEffect(() => {
    if (isHalloweenSeason()) setSeason('halloween')
    else if (isNewYearSeason()) setSeason('winter')
  }, [])
  return season
}

function Ear({ ear, transition, down, spooky }) {
  return (
    <motion.g
      style={{ transformOrigin: ear.origin }}
      animate={transition ? { rotate: [0, ear.side * -4, ear.side * 16, ear.side * -5, 0] } : { rotate: down ? ear.side * 24 : 0 }}
      transition={transition}
    >
      <path d={ear.outer} strokeLinejoin="round" className={spooky ? 'fill-[#f08a24]/10' : 'fill-modrinth-green/10'} />
      <path d={ear.inner} stroke="none" className={spooky ? 'fill-violet-400/50' : 'fill-modrinth-green/40'} />
    </motion.g>
  )
}

function Eyes({ mood, look }) {
  if (mood === 'happy') return <path d="M7.9 10.6q1.3-1.8 2.6 0M13.5 10.6q1.3-1.8 2.6 0" />
  if (mood === 'blink') return <path d="M8 10.2h2.4M13.6 10.2h2.4" />
  if (mood === 'sleep') return <path d="M7.9 9.9q1.3 1.4 2.6 0M13.5 9.9q1.3 1.4 2.6 0" />
  if (mood === 'wink') {
    return (
      <>
        <path d="M13.5 10.6q1.3-1.8 2.6 0" />
        <g stroke="none">
          <circle cx={9.2 + look.x * 0.7} cy={10 + look.y * 0.6} r="1.35" fill="currentColor" />
          <circle cx={8.75 + look.x * 0.7} cy={9.55 + look.y * 0.6} r="0.42" fill="white" />
        </g>
      </>
    )
  }
  const dx = look.x * 0.7
  const dy = look.y * 0.6
  return (
    <g stroke="none">
      {[9.2, 14.8].map((cx) => (
        <g key={cx}>
          <circle cx={cx + dx} cy={10 + dy} r="1.35" fill="currentColor" />
          <circle cx={cx + dx - 0.45} cy={10 + dy - 0.45} r="0.42" fill="white" />
        </g>
      ))}
    </g>
  )
}

function SpookyEyes({ mood, look }) {
  if (mood === 'happy' || mood === 'blink' || mood === 'sleep') return <Eyes mood={mood} look={look} />
  const dx = look.x * 0.5
  const dy = look.y * 0.4
  const open = mood === 'wink' ? [9.2] : [9.2, 14.8]
  return (
    <>
      {mood === 'wink' ? <path d="M13.5 10.6q1.3-1.8 2.6 0" /> : null}
      {open.map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="10" rx="1.75" ry="1.55" strokeWidth="0.5" className="fill-amber-300" />
          <ellipse cx={cx + dx} cy={10 + dy} rx="0.38" ry="1.15" stroke="none" className="fill-[#3a1d08]" />
          <circle cx={cx + 0.7} cy="9.3" r="0.32" stroke="none" fill="white" />
        </g>
      ))}
    </>
  )
}

function WitchHat() {
  return (
    <g transform="rotate(-10 12 3)" strokeWidth="1" strokeLinejoin="round">
      <path d="M9.3 3.1 12.2-2.6q.6-1 1.6-.8l1.4.5-1.3-.1q-.6 0-.7.6L14.9 3.1Z" className="fill-violet-500" />
      <path d="M9.8 2.1h4.9" stroke="#f08a24" strokeWidth="0.9" />
      <ellipse cx="12.1" cy="3.3" rx="4.4" ry="0.95" className="fill-violet-500" />
    </g>
  )
}

function SantaHat() {
  return (
    <g transform="rotate(-8 12 3)" strokeWidth="1" strokeLinejoin="round">
      <path d="M7.8 2.8Q9.4-3.2 14.2-3.4q3.4 0 4.4 3.6L16.6 2.8Z" className="fill-red-500" />
      <rect x="7" y="2.1" width="10.4" height="2.2" rx="1.1" className="fill-white" />
      <circle cx="18.6" cy="0.4" r="1.25" className="fill-white" />
    </g>
  )
}

function Scarf() {
  return (
    <g strokeWidth="0.7" strokeLinejoin="round">
      <path d="M15 19.8 18 18.9 18.9 24.4 16.2 25Z" className="fill-red-500" />
      <path d="M4.8 16.6Q12 22 19.2 16.6L20.3 19.6Q12 25.6 3.7 19.6Z" className="fill-red-500" />
      <path d="M8.3 19.4 7.8 21.9M12 20.3V23M15.7 19.4 16.2 21.9M16.4 21.3 18.3 20.8M16.8 23.3 18.6 22.8" stroke="white" strokeWidth="1" />
    </g>
  )
}

function Crown() {
  return (
    <g transform="rotate(-14 12 2.5)" strokeWidth="0.7" strokeLinejoin="round" stroke="#d97706">
      <path d="M8.7 3.5 8.2-0.5l2.1 1.8L12-1.6l1.7 2.9 2.1-1.8-.5 4Z" fill="#fbbf24" />
      <rect x="8.6" y="2.6" width="6.8" height="1.4" rx="0.5" fill="#f59e0b" />
      <circle cx="12" cy="3.3" r="0.45" stroke="none" fill="#f43f5e" />
      <circle cx="12" cy="-1.7" r="0.55" fill="#fde68a" />
    </g>
  )
}

function Mantle() {
  return (
    <>
      <path d="M4.6 19.4Q12 23.6 19.4 19.4L22 26.4Q12 29 2 26.4Z" strokeWidth="0.7" strokeLinejoin="round" stroke="#9f1239" fill="#e11d48" />
      <path d="M4.2 18.2Q12 23.8 19.8 18.2L20.7 20.4Q12 26.2 3.3 20.4Z" strokeWidth="0.6" strokeLinejoin="round" stroke="#cbd5e1" fill="white" />
      <g stroke="none" fill="#1f2937">
        <ellipse cx="7" cy="20.9" rx="0.3" ry="0.55" />
        <ellipse cx="9.6" cy="22.1" rx="0.3" ry="0.55" />
        <ellipse cx="14.4" cy="22.1" rx="0.3" ry="0.55" />
        <ellipse cx="17" cy="20.9" rx="0.3" ry="0.55" />
      </g>
      <circle cx="12" cy="23.4" r="0.95" strokeWidth="0.6" stroke="#d97706" fill="#fbbf24" />
    </>
  )
}

function Paw({ cx, shift = 0, lift, delay }) {
  return (
    <motion.g
      initial={{ y: 12, opacity: 0 }}
      animate={{ x: shift, y: lift, opacity: 1 }}
      exit={{ y: 12, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24, delay }}
    >
      <ellipse cx={cx} cy="10.6" rx="2.7" ry="2.3" stroke="none" fill="currentColor" />
      <ellipse cx={cx} cy="11.2" rx="1" ry="0.75" stroke="none" fill="white" fillOpacity="0.45" />
      {[-1.2, 0, 1.2].map((dx) => (
        <circle key={dx} cx={cx + dx} cy={dx ? 9.3 : 9} r="0.42" stroke="none" fill="white" fillOpacity="0.45" />
      ))}
    </motion.g>
  )
}

export function KittenFace({ earTransition, earsDown = false, mood = 'look', look = { x: 0, y: 0 }, paws = null, royal = false, className = 'h-24 w-24' }) {
  const season = useKittenSeason()
  const spooky = !royal && season === 'halloween'
  const winter = !royal && season === 'winter'
  return (
    <svg
      className={`${className} overflow-visible ${spooky ? 'text-[#f08a24]' : 'text-modrinth-green'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      viewBox="0 0 24 24"
      aria-hidden
    >
      {EARS.map((ear) => (
        <Ear key={ear.side} ear={ear} transition={earTransition} down={earsDown} spooky={spooky} />
      ))}
      <circle cx="12" cy="12" r="9" className={spooky ? 'fill-[#f08a24]/10' : 'fill-modrinth-green/10'} />
      {spooky ? <WitchHat /> : null}
      {winter ? <SantaHat /> : null}
      {royal ? <Crown /> : null}
      <ellipse cx="7.6" cy="13.4" rx="1.5" ry="0.9" stroke="none" className={spooky ? 'fill-violet-400/40' : winter || royal ? 'fill-pink-400/45' : 'fill-modrinth-green/35'} />
      <ellipse cx="16.4" cy="13.4" rx="1.5" ry="0.9" stroke="none" className={spooky ? 'fill-violet-400/40' : winter || royal ? 'fill-pink-400/45' : 'fill-modrinth-green/35'} />
      {spooky && mood !== 'sleep' ? <path d="M7.4 7.7 10.5 8.6M16.6 7.7 13.5 8.6" strokeWidth="1.1" /> : null}
      {spooky ? <SpookyEyes mood={mood} look={look} /> : <Eyes mood={mood} look={look} />}
      <AnimatePresence>
        {paws ? <Paw key="left" cx={9.2} shift={paws === 'peek' ? -1.6 : 0} lift={paws === 'peek' ? 2.2 : 0} delay={0} /> : null}
        {paws ? <Paw key="right" cx={14.8} lift={0} delay={0.05} /> : null}
      </AnimatePresence>
      <path d="M11.4 12.5h1.2l-.6.7Z" fill="currentColor" strokeWidth="1" strokeLinejoin="round" />
      {spooky ? (
        <>
          <path d="M10.2 13.6q1.8 1.6 3.6 0" />
          <path d="M10.8 14.1 11.15 15.1 11.5 14.3ZM12.5 14.3 12.85 15.1 13.2 14.1Z" stroke="none" fill="white" />
        </>
      ) : (
        <path d="M12 13.3q-.4 1.4-1.6 1.1M12 13.3q.4 1.4 1.6 1.1" />
      )}
      <path d="M3.6 12.2 6.4 12.8M3.9 14.6l2.6-.7M20.4 12.2l-2.8.6M20.1 14.6l-2.6-.7" strokeWidth="1" />
      {winter ? <Scarf /> : null}
      {royal ? <Mantle /> : null}
    </svg>
  )
}

export function useKittenMood(enabled, faceRef, base = 'look') {
  const [look, setLook] = useState({ x: 0, y: 0 })
  const [mood, setMood] = useState(base)
  const moodTimer = useRef(null)

  useEffect(() => {
    setMood(base)
  }, [base])

  const showMood = useCallback(
    (next, ms) => {
      clearTimeout(moodTimer.current)
      setMood(next)
      moodTimer.current = setTimeout(() => setMood(base), ms)
    },
    [base],
  )

  useEffect(() => {
    if (!enabled) return undefined
    const onMove = (event) => {
      const rect = faceRef.current?.getBoundingClientRect()
      if (!rect) return
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      const length = Math.hypot(dx, dy) || 1
      const reach = Math.min(1, length / 160)
      setLook({ x: (dx / length) * reach, y: (dy / length) * reach })
    }
    let blinkTimer = null
    const blink = () => {
      blinkTimer = setTimeout(() => {
        setMood((current) => {
          if (current !== 'look') return current
          clearTimeout(moodTimer.current)
          moodTimer.current = setTimeout(() => setMood('look'), 140)
          return 'blink'
        })
        blink()
      }, random(2200, 5200))
    }
    blink()
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      clearTimeout(blinkTimer)
      clearTimeout(moodTimer.current)
    }
  }, [enabled, faceRef])

  return { look, mood, showMood }
}

export function useKittenHearts() {
  const [hearts, setHearts] = useState([])
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const burst = useCallback((count = 6, spread = 46) => {
    const now = Date.now()
    const fresh = Array.from({ length: count }, (_, index) => ({
      id: `${now}-${index}`,
      kind: index % 3,
      x: random(-spread, spread),
      sway: random(-14, 14),
      rise: random(spread * 1.5, spread * 2.6),
    }))
    setHearts((current) => [...current.slice(-12), ...fresh])
    timers.current.push(setTimeout(() => setHearts((current) => current.filter((heart) => !fresh.includes(heart))), 1200))
  }, [])

  return { hearts, burst }
}

function Treat({ kind }) {
  if (kind === 0) return <path d={BAT_PATH} className="fill-violet-400" />
  if (kind === 1) {
    return (
      <>
        <ellipse cx="12" cy="14.5" rx="8.5" ry="6.5" fill="#f08a24" />
        <path d="M9 9.5q-1.6 5 0 10M15 9.5q1.6 5 0 10" stroke="#e07818" strokeWidth="1.2" fill="none" />
        <path d="M12 8.4c0-2 .6-3.3 2-4.2" stroke="#3d8f3a" strokeWidth="2" strokeLinecap="round" fill="none" />
      </>
    )
  }
  return (
    <>
      <path d="M7.5 12 2.5 8.2v7.6ZM16.5 12l5-3.8v7.6Z" className="fill-amber-300" />
      <circle cx="12" cy="12" r="5" className="fill-pink-400" />
      <path d="M9.2 10q2.8 2 5.6 4" stroke="white" strokeOpacity="0.6" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </>
  )
}

function WinterTreat({ kind }) {
  if (kind === 0) {
    return (
      <g fill="none" stroke="#bae6fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <path key={angle} d="M12 12V3.5M9.9 5.4 12 7.4 14.1 5.4" transform={`rotate(${angle} 12 12)`} />
        ))}
      </g>
    )
  }
  if (kind === 1) {
    return (
      <>
        <rect x="4.5" y="10" width="15" height="11" rx="1.5" className="fill-red-500" />
        <rect x="3.5" y="7" width="17" height="3.6" rx="1" className="fill-red-400" />
        <rect x="10.8" y="7" width="2.4" height="14" className="fill-amber-300" />
        <path d="M12 7C9.4 3.2 6.6 5.4 8.8 7ZM12 7c2.6-3.8 5.4-1.6 3.2 0Z" className="fill-amber-300" />
      </>
    )
  }
  return (
    <>
      <path d="M12 3.5 17 10h-2.4l4.4 6H5l4.4-6H7Z" className="fill-green-500" />
      <rect x="10.8" y="16" width="2.4" height="3.6" rx="0.5" fill="#92400e" />
      <circle cx="12" cy="3.6" r="1.4" className="fill-amber-300" />
      <circle cx="10.4" cy="12.6" r="0.8" className="fill-red-400" />
      <circle cx="14" cy="14.4" r="0.8" className="fill-amber-300" />
    </>
  )
}

export function KittenHearts({ items, className = 'bottom-20 h-4 w-4' }) {
  const season = useKittenSeason()
  return (
    <AnimatePresence>
      {items.map((heart) => (
        <motion.svg
          key={heart.id}
          aria-hidden
          viewBox="0 0 24 24"
          className={`pointer-events-none absolute left-1/2 z-10 fill-modrinth-green ${className}`}
          initial={{ x: heart.x * 0.3, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: [heart.x * 0.3, heart.x, heart.x + heart.sway], y: -heart.rise, scale: [0, 1.2, 1], opacity: [1, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        >
          {season === 'halloween' ? <Treat kind={heart.kind} /> : season === 'winter' ? <WinterTreat kind={heart.kind} /> : <path d={HEART_PATH} />}
        </motion.svg>
      ))}
    </AnimatePresence>
  )
}
