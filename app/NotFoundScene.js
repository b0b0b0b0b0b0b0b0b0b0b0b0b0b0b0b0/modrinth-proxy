'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { KittenFace, KittenHearts, useKittenHearts, useKittenMood } from './components/Kitten'
import { onSoundsMutedChange, playBloop, playChime, playPop, setSoundsMuted, soundsMuted } from './components/softSounds'

const GLYPHS = {
  4: ['1.1', '1.1', '111', '..1', '..1'],
  0: ['111', '1.1', '1.1', '1.1', '111'],
}
const DIGITS = ['4', '0', '4']
const BOUNCE_S = 1.7
const JUMP_PX = 80
const IMPACT = 0.48
const FALL = [0.55, 0, 1, 0.45]
const RISE = [0, 0.55, 0.45, 1]
const RESPAWN_MS = 2500
const GLITCH_DIGIT = 1
const GLITCH_FIRST_MS = 1600
const GLITCH_FRAME_MS = 70
const BLOCK_SHADE = 'inset 0 -4px 0 rgba(0,0,0,0.25), inset 0 3px 0 rgba(255,255,255,0.25)'
const FLICKER_COLORS = ['#fcee0a', '#00f0ff', '#ff003c']
const GLITCH_BANDS = 7
const GRID_COLS = 11
const GRID_ROWS = 5
const WAVE_STEP_S = 0.045
const WAVE_LIFT_PX = 14
const CAT_ORIGIN = { x: GRID_COLS / 2, y: -3 }
const BURST_MS = 900
const FLOOR_RING = Array.from({ length: 16 }, (_, index) => (index / 16) * Math.PI * 2)
const BURST_RAYS = Array.from({ length: 14 }, (_, index) => (index / 14) * Math.PI * 2)
const DUST = [
  { side: -1, reach: 58, lift: 18, size: 5 },
  { side: -1, reach: 46, lift: 10, size: 4 },
  { side: -1, reach: 66, lift: 6, size: 3 },
  { side: 1, reach: 58, lift: 18, size: 5 },
  { side: 1, reach: 46, lift: 10, size: 4 },
  { side: 1, reach: 66, lift: 6, size: 3 },
]

const blocks = DIGITS.flatMap((digit, digitIndex) =>
  GLYPHS[digit].flatMap((row, y) =>
    [...row].flatMap((cell, x) => (cell === '1' ? [{ id: `${digitIndex}-${x}-${y}`, digit: digitIndex, x: digitIndex * 4 + x, y }] : [])),
  ),
)

function glitchBand(block) {
  return (block.x - block.digit * 4) + block.y
}

const zeroBlocks = blocks.filter((block) => block.digit === GLITCH_DIGIT)
const random = (min, max) => min + Math.random() * (max - min)
const chance = (p) => Math.random() < p
const signed = (min, max) => Math.round(random(min, max)) * (chance(0.5) ? 1 : -1)

function quietFrame() {
  if (!chance(0.12)) return null
  const shifts = new Map()
  if (chance(0.3)) {
    const band = Math.floor(random(0, GLITCH_BANDS))
    const d = signed(1, 1)
    for (const block of zeroBlocks) if (glitchBand(block) === band) shifts.set(block.id, d)
  }
  return { shifts, split: 1, colors: new Map(), hidden: new Set() }
}

function burstFrame() {
  const shifts = new Map()
  const colors = new Map()
  const hidden = new Set()
  const kind = Math.floor(random(0, 4))
  if (kind === 0) {
    const bands = Array.from({ length: GLITCH_BANDS }, () => (chance(0.5) ? signed(2, 9) : 0))
    for (const block of zeroBlocks) if (bands[glitchBand(block)]) shifts.set(block.id, bands[glitchBand(block)])
  } else if (kind === 1) {
    const band = Math.floor(random(0, GLITCH_BANDS))
    const d = signed(10, 16)
    for (const block of zeroBlocks) if (Math.abs(glitchBand(block) - band) <= 1) shifts.set(block.id, d)
  } else if (kind === 2) {
    const d = signed(2, 5)
    for (const block of zeroBlocks) shifts.set(block.id, d)
  } else {
    for (const block of zeroBlocks) if (chance(0.3)) shifts.set(block.id, signed(1, 6))
  }
  for (const block of zeroBlocks) {
    if (chance(0.22)) colors.set(block.id, FLICKER_COLORS[Math.floor(random(0, FLICKER_COLORS.length))])
    else if (chance(0.1)) hidden.add(block.id)
  }
  return { shifts, split: Math.round(random(2, 5)), colors, hidden }
}

function useGlitch(enabled) {
  const [frame, setFrame] = useState(null)

  useEffect(() => {
    if (!enabled) return undefined
    let burstUntil = 0
    let nextBurst = Date.now() + GLITCH_FIRST_MS
    let seriesLeft = 0
    const interval = setInterval(() => {
      const now = Date.now()
      if (now >= nextBurst) {
        if (seriesLeft <= 0) seriesLeft = 1 + Math.floor(random(0, 3))
        seriesLeft -= 1
        burstUntil = now + random(120, 380)
        nextBurst = burstUntil + (seriesLeft > 0 ? random(90, 260) : random(2500, 6000))
      }
      setFrame(now < burstUntil ? burstFrame() : quietFrame())
    }, GLITCH_FRAME_MS)
    return () => clearInterval(interval)
  }, [enabled])

  return frame
}

function Block({ block, reduceMotion, glitch, wave }) {
  const [broken, setBroken] = useState(false)
  const timer = useRef(null)
  const hop = useAnimationControls()

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (!wave || reduceMotion) return
    const dx = block.x + 0.5 - wave.x
    const dy = block.y + 0.5 - wave.y
    const distance = Math.hypot(dx, dy)
    const power = wave.power * Math.max(0.2, 1 - distance / 16)
    const lift = WAVE_LIFT_PX * power
    const tilt = Math.sign(dx || 1) * 9 * power
    hop.start(
      { y: [0, -lift, 0, -lift * 0.3, 0], rotate: [0, tilt, -tilt * 0.4, 0, 0], scaleY: [1, 1.1, 0.88, 1.03, 1] },
      { delay: distance * WAVE_STEP_S, duration: 0.55, times: [0, 0.3, 0.55, 0.75, 1], ease: 'easeOut' },
    )
  }, [wave, reduceMotion, block.x, block.y, hop])

  const mine = () => {
    if (broken) return
    playPop()
    setBroken(true)
    timer.current = setTimeout(() => setBroken(false), RESPAWN_MS)
  }

  return (
    <motion.div animate={hop} style={{ gridColumn: block.x + 1, gridRow: block.y + 1 }} className="aspect-square">
      <motion.button
        type="button"
        tabIndex={-1}
        aria-hidden
        data-sound
        onClick={mine}
        initial={reduceMotion ? false : { y: -120, opacity: 0 }}
        animate={broken ? { scale: 0, rotate: 45, opacity: 0 } : { y: 0, opacity: 1, scale: 1, rotate: 0 }}
        transition={
          broken
            ? { duration: 0.2, ease: 'easeIn' }
            : { type: 'spring', stiffness: 420, damping: 22, delay: reduceMotion ? 0 : 0.1 + block.x * 0.025 + (4 - block.y) * 0.05 }
        }
        whileHover={reduceMotion || broken ? undefined : { y: -3 }}
        style={{
          translate: glitch?.shifts.get(block.id) ? `${-glitch.shifts.get(block.id)}px ${glitch.shifts.get(block.id)}px` : undefined,
          boxShadow: glitch?.split
            ? `${BLOCK_SHADE}, ${-glitch.split}px ${glitch.split}px 0 rgba(255,0,60,0.8), ${glitch.split}px ${-glitch.split}px 0 rgba(0,240,255,0.8)`
            : BLOCK_SHADE,
          backgroundColor: glitch?.colors.get(block.id),
          visibility: glitch?.hidden.has(block.id) ? 'hidden' : undefined,
        }}
        className="relative block h-full w-full cursor-pointer rounded-[3px] bg-modrinth-green"
      >
        <span className="absolute inset-[22%] rounded-[2px] bg-white/10" />
      </motion.button>
    </motion.div>
  )
}

function Landing() {
  return (
    <>
      {FLOOR_RING.map((angle) => {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle) * 0.28
        return (
          <motion.span
            key={angle}
            aria-hidden
            className="absolute bottom-0 left-1/2 h-1.5 w-1.5 rounded-[1px] bg-modrinth-green"
            initial={{ x: cos * 40, y: sin * 40, opacity: 1, scale: 1.4 }}
            animate={{ x: cos * 118, y: sin * 118, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )
      })}
      {DUST.map((dust, index) => (
        <motion.span
          key={index}
          aria-hidden
          className="absolute bottom-1 left-1/2 rounded-[1px] bg-modrinth-green"
          style={{ width: dust.size, height: dust.size }}
          initial={{ x: dust.side * 30, y: 0, opacity: 0.9, rotate: 0 }}
          animate={{ x: dust.side * dust.reach, y: [0, -dust.lift, -dust.lift / 3], opacity: 0, rotate: dust.side * 90 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

function pickTrick() {
  const roll = Math.random()
  const dir = chance(0.5) ? 1 : -1
  if (roll < 0.34) return { kind: 'tilt', dir }
  if (roll < 0.8) return { kind: 'spin', dir, turns: 1 }
  if (roll < 0.92) return { kind: 'wiggle', dir }
  return { kind: 'spin', dir, turns: 2 }
}

function trickKeyframes(trick, from) {
  if (trick.kind === 'tilt') return [from, from + trick.dir * 16, from]
  if (trick.kind === 'wiggle') return [from, from + trick.dir * 14, from - trick.dir * 14, from + trick.dir * 8, from]
  return [from, from + trick.dir * 360 * trick.turns]
}

function BouncingFace({ reduceMotion, onImpact }) {
  const lastScale = useRef(1)
  const angle = useRef(0)
  const queued = useRef(null)
  const faceRef = useRef(null)
  const spin = useAnimationControls()
  const [landing, setLanding] = useState(0)
  const { hearts, burst } = useKittenHearts()
  const { look, mood, showMood } = useKittenMood(!reduceMotion, faceRef)
  const loop = { duration: BOUNCE_S, repeat: Infinity }
  const contact = { ...loop, times: [0, IMPACT, IMPACT + 0.02, IMPACT + 0.045, 1], ease: [FALL, 'easeOut', 'easeOut', RISE] }

  const land = () => {
    setLanding((current) => current + 1)
    onImpact?.()
    if (chance(0.3)) showMood('happy', 520)
    const trick = queued.current || pickTrick()
    queued.current = null
    const frames = trickKeyframes(trick, angle.current)
    angle.current = frames[frames.length - 1]
    spin.start({ rotate: frames }, { delay: 0.07, duration: BOUNCE_S - 0.24, ease: 'easeInOut' })
  }

  const pet = () => {
    queued.current = { kind: 'spin', dir: chance(0.5) ? 1 : -1, turns: 2 }
    showMood('happy', 1100)
    playChime()
    burst()
  }

  if (reduceMotion) {
    return (
      <div className="mx-auto flex h-48 w-40 items-end justify-center">
        <KittenFace mood="happy" />
      </div>
    )
  }

  return (
    <div className="relative mx-auto h-48 w-40">
      {landing ? <Landing key={landing} /> : null}
      <motion.span
        aria-hidden
        className="absolute bottom-0 left-1/2 h-2.5 w-16 rounded-[50%] bg-black/40 blur-[2px]"
        style={{ x: '-50%', y: '50%' }}
        animate={{ scaleX: [0.55, 1, 1.12, 1, 0.55], opacity: [0.25, 0.6, 0.75, 0.6, 0.25] }}
        transition={contact}
      />
      <KittenHearts items={hearts} />
      <motion.div
        className="absolute -bottom-3 left-1/2 -ml-12"
        style={{ originX: 0.5, originY: 0.875 }}
        onUpdate={(latest) => {
          const scale = Number(latest.scaleY)
          if (!Number.isFinite(scale)) return
          if (lastScale.current >= 0.97 && scale < 0.97) land()
          lastScale.current = scale
        }}
        animate={{ y: [-JUMP_PX, 0, 0, -JUMP_PX], scaleY: [1, 1.06, 0.8, 1.03, 1], scaleX: [1, 0.96, 1.16, 0.99, 1] }}
        transition={{
          ...loop,
          y: { ...loop, times: [0, IMPACT, IMPACT + 0.03, 1], ease: [FALL, 'linear', RISE] },
          scaleY: contact,
          scaleX: contact,
        }}
      >
        <motion.div ref={faceRef} animate={spin} onPointerDown={pet} data-sound className="cursor-pointer">
          <KittenFace earTransition={contact} mood={mood} look={look} />
        </motion.div>
      </motion.div>
    </div>
  )
}

function SoundToggle({ labels }) {
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    setMuted(soundsMuted())
    return onSoundsMutedChange(setMuted)
  }, [])

  const toggle = () => {
    setSoundsMuted(!muted)
    if (muted) setTimeout(playChime, 0)
  }

  return (
    <button
      type="button"
      data-no-wave
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? labels.on : labels.off}
      title={muted ? labels.on : labels.off}
      className="absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gray-800 text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-modrinth-green"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
        <path d="M11 5 6 9H2v6h4l5 4Z" />
        {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
      </svg>
    </button>
  )
}

function Burst({ x, y }) {
  return (
    <div aria-hidden className="pointer-events-none fixed z-[300]" style={{ left: x, top: y }}>
      <motion.span
        className="absolute -left-3 -top-3 h-6 w-6 rounded-[3px] border-2 border-modrinth-green"
        initial={{ scale: 0.3, opacity: 0.9, rotate: 0 }}
        animate={{ scale: 4, opacity: 0, rotate: 90 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {BURST_RAYS.map((angle, index) => {
        const reach = 46 + (index % 3) * 14
        const size = 3 + (index % 3)
        return (
          <motion.span
            key={angle}
            className="absolute rounded-[1px] bg-modrinth-green"
            style={{ width: size, height: size, left: -size / 2, top: -size / 2 }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * reach,
              y: [0, Math.sin(angle) * reach, Math.sin(angle) * reach + 18],
              opacity: [1, 1, 0],
              rotate: index % 2 ? 180 : -180,
            }}
            transition={{ duration: BURST_MS / 1000, ease: 'easeOut', times: [0, 0.55, 1] }}
          />
        )
      })}
    </div>
  )
}

export default function NotFoundScene({ label, soundLabels }) {
  const reduceMotion = useReducedMotion()
  const glitch = useGlitch(!reduceMotion)
  const gridRef = useRef(null)
  const [wave, setWave] = useState(null)
  const [bursts, setBursts] = useState([])

  const shake = useCallback((origin, power) => {
    setWave({ ...origin, power, id: Date.now() + Math.random() })
  }, [])

  useEffect(() => {
    if (reduceMotion) return undefined
    const onPointer = (event) => {
      if (event.button !== 0 || event.target.closest?.('a, input, textarea, select, [role="dialog"], [data-no-wave]')) return
      if (!event.target.closest?.('[data-sound]')) playBloop()
      const rect = gridRef.current?.getBoundingClientRect()
      if (!rect) return
      shake(
        {
          x: ((event.clientX - rect.left) / rect.width) * GRID_COLS,
          y: ((event.clientY - rect.top) / rect.height) * GRID_ROWS,
        },
        1.3,
      )
      const id = Date.now() + Math.random()
      setBursts((current) => [...current.slice(-5), { id, x: event.clientX, y: event.clientY }])
      setTimeout(() => setBursts((current) => current.filter((burst) => burst.id !== id)), BURST_MS)
    }
    window.addEventListener('pointerdown', onPointer)
    return () => window.removeEventListener('pointerdown', onPointer)
  }, [reduceMotion, shake])

  return (
    <div className="relative select-none">
      <SoundToggle labels={soundLabels} />
      <BouncingFace reduceMotion={reduceMotion} onImpact={() => shake(CAT_ORIGIN, 1)} />
      <h1 className="sr-only">{label}</h1>
      <div
        ref={gridRef}
        className="mx-auto mt-8 grid w-full max-w-[19rem] grid-cols-[repeat(11,minmax(0,1fr))] gap-1 sm:max-w-sm sm:gap-1.5"
      >
        {blocks.map((block) => (
          <Block
            key={block.id}
            block={block}
            reduceMotion={reduceMotion}
            glitch={block.digit === GLITCH_DIGIT ? glitch : null}
            wave={wave}
          />
        ))}
      </div>
      <AnimatePresence>
        {bursts.map((burst) => (
          <Burst key={burst.id} x={burst.x} y={burst.y} />
        ))}
      </AnimatePresence>
    </div>
  )
}
