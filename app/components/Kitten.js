'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const HEART_PATH =
  'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z'
const EARS = [
  { side: -1, outer: 'M5.7 5.6 5 0.9 10.1 3.2', inner: 'M6.6 5 6.3 2.6 8.8 3.7Z', origin: '8px 4.5px' },
  { side: 1, outer: 'M18.3 5.6 19 0.9 13.9 3.2', inner: 'M17.4 5 17.7 2.6 15.2 3.7Z', origin: '16px 4.5px' },
]

const random = (min, max) => min + Math.random() * (max - min)

function Ear({ ear, transition }) {
  return (
    <motion.g
      style={{ transformOrigin: ear.origin }}
      animate={transition ? { rotate: [0, ear.side * -4, ear.side * 16, ear.side * -5, 0] } : undefined}
      transition={transition}
    >
      <path d={ear.outer} strokeLinejoin="round" className="fill-modrinth-green/10" />
      <path d={ear.inner} stroke="none" className="fill-modrinth-green/40" />
    </motion.g>
  )
}

function Eyes({ mood, look }) {
  if (mood === 'happy') return <path d="M7.9 10.6q1.3-1.8 2.6 0M13.5 10.6q1.3-1.8 2.6 0" />
  if (mood === 'blink') return <path d="M8 10.2h2.4M13.6 10.2h2.4" />
  if (mood === 'sleep') return <path d="M7.9 9.9q1.3 1.4 2.6 0M13.5 9.9q1.3 1.4 2.6 0" />
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

export function KittenFace({ earTransition, mood = 'look', look = { x: 0, y: 0 }, paws = null, className = 'h-24 w-24' }) {
  return (
    <svg
      className={`${className} overflow-visible text-modrinth-green`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      viewBox="0 0 24 24"
      aria-hidden
    >
      {EARS.map((ear) => (
        <Ear key={ear.side} ear={ear} transition={earTransition} />
      ))}
      <circle cx="12" cy="12" r="9" className="fill-modrinth-green/10" />
      <ellipse cx="7.6" cy="13.4" rx="1.5" ry="0.9" stroke="none" className="fill-modrinth-green/35" />
      <ellipse cx="16.4" cy="13.4" rx="1.5" ry="0.9" stroke="none" className="fill-modrinth-green/35" />
      <Eyes mood={mood} look={look} />
      <AnimatePresence>
        {paws ? <Paw key="left" cx={9.2} shift={paws === 'peek' ? -1.6 : 0} lift={paws === 'peek' ? 2.2 : 0} delay={0} /> : null}
        {paws ? <Paw key="right" cx={14.8} lift={0} delay={0.05} /> : null}
      </AnimatePresence>
      <path d="M11.4 12.5h1.2l-.6.7Z" fill="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <path d="M12 13.3q-.4 1.4-1.6 1.1M12 13.3q.4 1.4 1.6 1.1" />
      <path d="M3.6 12.2 6.4 12.8M3.9 14.6l2.6-.7M20.4 12.2l-2.8.6M20.1 14.6l-2.6-.7" strokeWidth="1" />
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
      x: random(-spread, spread),
      sway: random(-14, 14),
      rise: random(spread * 1.5, spread * 2.6),
    }))
    setHearts((current) => [...current.slice(-12), ...fresh])
    timers.current.push(setTimeout(() => setHearts((current) => current.filter((heart) => !fresh.includes(heart))), 1200))
  }, [])

  return { hearts, burst }
}

export function KittenHearts({ items, className = 'bottom-20 h-4 w-4' }) {
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
          <path d={HEART_PATH} />
        </motion.svg>
      ))}
    </AnimatePresence>
  )
}
