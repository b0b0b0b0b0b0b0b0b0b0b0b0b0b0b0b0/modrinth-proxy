'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { isNewYearSeason, SNOWBALL_DELAY_MS } from '@/lib/newYear'
import { driftPath } from './NewYearEffects'
import { KittenFace, KittenHearts, useKittenHearts, useKittenMood } from './Kitten'
import { playMew } from './softSounds'
import { useT } from './I18nProvider'

const SEEN_KEY = 'kitten-snowball-day'
const SPECKS = [
  { left: '22%', top: '30%' },
  { left: '60%', top: '58%' },
  { left: '40%', top: '72%' },
]

const CALL_EVENT = 'kitten-snowball-call'
const STATE_EVENT = 'kitten-snowball'
let walking = false

const today = () => new Date().toDateString()

export function snowballAllowed() {
  return isNewYearSeason() && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function callSnowballKitten() {
  window.dispatchEvent(new Event(CALL_EVENT))
}

export function isSnowballWalking() {
  return walking
}

export function onSnowballCall(listener) {
  window.addEventListener(CALL_EVENT, listener)
  return () => window.removeEventListener(CALL_EVENT, listener)
}

export function claimWalk() {
  if (walking) return false
  walking = true
  window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: true }))
  return true
}

export function releaseWalk() {
  if (!walking) return
  walking = false
  window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: false }))
}

export function onSnowballChange(listener) {
  const handler = (event) => listener(event.detail)
  window.addEventListener(STATE_EVENT, handler)
  return () => window.removeEventListener(STATE_EVENT, handler)
}

const STEP_MS = 210
const PUFF_LIFE = 0.65
const rand = (min, max) => min + Math.random() * (max - min)

function useSnowPuffs(dir, speed) {
  const [puffs, setPuffs] = useState([])
  useEffect(() => {
    let id = 0
    const timers = []
    const step = setInterval(() => {
      const fresh = Array.from({ length: 2 + Math.round(Math.random()) }, () => ({
        id: id++,
        size: rand(3, 6),
        x: -dir * (speed * PUFF_LIFE + rand(4, 16)),
        lift: rand(7, 15),
        start: rand(-4, 4),
      }))
      setPuffs((current) => [...current.slice(-14), ...fresh])
      timers.push(setTimeout(() => setPuffs((current) => current.filter((puff) => !fresh.includes(puff))), PUFF_LIFE * 1000 + 50))
    }, STEP_MS)
    return () => {
      clearInterval(step)
      timers.forEach(clearTimeout)
    }
  }, [dir, speed])
  return puffs
}

function SnowPuffs({ items }) {
  return items.map((puff) => (
    <motion.span
      key={puff.id}
      aria-hidden
      className="pointer-events-none absolute bottom-0.5 left-1/2 rounded-full bg-[#f4f8ff] shadow-[0_0_3px_rgba(180,210,240,0.7)]"
      style={{ width: puff.size, height: puff.size, marginLeft: puff.start }}
      initial={{ x: 0, y: 0, opacity: 0.95, scale: 1 }}
      animate={{ x: puff.x, y: [0, -puff.lift, 1], opacity: [0.95, 0.9, 0], scale: [1, 1, 0.6] }}
      transition={{ duration: PUFF_LIFE, ease: 'easeOut', y: { duration: PUFF_LIFE, ease: [0.2, 0.7, 0.5, 1] } }}
    />
  ))
}

function seenToday() {
  try {
    return localStorage.getItem(SEEN_KEY) === today()
  } catch {
    return false
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, today())
  } catch {}
}

function navHeight() {
  const nav = document.querySelector('[data-mobile-nav]')
  if (!nav || getComputedStyle(nav).display === 'none') return 0
  return Math.round(nav.getBoundingClientRect().height)
}

export function Walker({ width, dir, onDone, className = 'bottom-[6px]' }) {
  const t = useT()
  const faceRef = useRef(null)
  const { mood, showMood } = useKittenMood(false, faceRef, 'look')
  const { hearts, burst } = useKittenHearts()
  const duration = Math.max(9, width / 85)
  const from = dir === 1 ? -110 : width + 30
  const to = dir === 1 ? width + 30 : -110
  const timing = { duration, ease: 'linear' }
  const puffs = useSnowPuffs(dir, Math.abs(to - from) / duration)

  const pet = () => {
    showMood('happy', 1200)
    playMew()
    burst(5, 24)
  }

  const kitten = (
    <div key="kitten" className="relative h-12 w-12 shrink-0">
      <KittenHearts items={hearts} className="bottom-11 h-3 w-3" />
      <SnowPuffs items={puffs} />
      <motion.button
        ref={faceRef}
        type="button"
        onClick={pet}
        aria-label={t('account.petKitten')}
        animate={{ y: [0, -3, 0], rotate: [dir * 3, dir * 9, dir * 3] }}
        transition={{ duration: 0.42, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originY: 1 }}
        className="pointer-events-auto block h-full w-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green"
      >
        <KittenFace mood={mood} look={{ x: dir * 0.8, y: 0.5 }} className="h-full w-full" />
      </motion.button>
    </div>
  )

  const ball = (
    <motion.div
      key="ball"
      aria-hidden
      className="relative mb-0.5 shrink-0 rounded-full bg-[#f4f8ff] shadow-[inset_-3px_-4px_6px_rgba(140,170,205,0.55),0_2px_3px_rgba(20,40,70,0.25)]"
      initial={{ width: 8, height: 8, rotate: 0 }}
      animate={{ width: 46, height: 46, rotate: dir * 360 * (duration / 1.6) }}
      transition={timing}
    >
      {SPECKS.map((speck) => (
        <span key={speck.left} className="absolute h-[14%] w-[14%] rounded-full bg-sky-200/80" style={speck} />
      ))}
    </motion.div>
  )

  return (
    <motion.div
      className={`absolute left-0 z-10 flex items-end gap-0.5 ${className}`}
      initial={{ x: from }}
      animate={{ x: to }}
      transition={timing}
      onAnimationComplete={onDone}
    >
      {dir === 1 ? [kitten, ball] : [ball, kitten]}
    </motion.div>
  )
}

export default function KittenSnowball() {
  const [walk, setWalk] = useState(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!snowballAllowed()) return undefined
    const begin = () => {
      if (!claimWalk()) return
      markSeen()
      setGone(false)
      setWalk({ dir: Math.random() < 0.5 ? 1 : -1, width: window.innerWidth, bottom: navHeight() })
    }
    const forced = new URLSearchParams(window.location.search).has('snowball')
    let timer = null
    const later = () => {
      if (document.visibilityState !== 'visible') {
        timer = setTimeout(later, 3000)
        return
      }
      begin()
    }
    if (forced || !seenToday()) timer = setTimeout(later, forced ? 1500 : SNOWBALL_DELAY_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  if (!walk) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[60] h-0 overflow-x-clip" style={{ bottom: walk.bottom }} aria-hidden={gone}>
      <AnimatePresence
        onExitComplete={() => {
          setWalk(null)
          releaseWalk()
        }}
      >
        {gone ? null : (
          <motion.div
            key="snow"
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0, transition: { duration: 1.4, ease: 'easeIn' } }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <svg className="footer-drift" style={{ top: 'auto', bottom: -2 }} viewBox={`0 0 ${walk.width} 16`} preserveAspectRatio="none" aria-hidden>
              <path d={driftPath(walk.width, 2)} />
            </svg>
            <Walker width={walk.width} dir={walk.dir} onDone={() => setGone(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
