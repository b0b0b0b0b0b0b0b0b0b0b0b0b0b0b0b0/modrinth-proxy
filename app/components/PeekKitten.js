'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { KittenFace, KittenHearts, useKittenHearts, useKittenMood } from './Kitten'
import { useT } from './I18nProvider'
import { playMew } from './softSounds'
import { OIIA_TAPS, onOiiaChange, startOiia } from './OiiaParty'

const POSES = {
  phone: { rest: '-5%', peek: '-25%' },
  wide: { rest: '39%', peek: '7%' },
}
const JUMP_Y = '-64%'
const TAP_GAP_MS = 1200
const WIDE_QUERY = '(min-width: 640px)'
const random = (min, max) => min + Math.random() * (max - min)

export default function PeekKitten() {
  const t = useT()
  const reduceMotion = useReducedMotion()
  const faceRef = useRef(null)
  const body = useAnimationControls()
  const { look, mood, showMood } = useKittenMood(!reduceMotion, faceRef)
  const { hearts, burst } = useKittenHearts()
  const [side, setSide] = useState(null)
  const busy = useRef(false)
  const pose = useRef(POSES.phone)
  const hovering = useRef(false)
  const leaveTimer = useRef(null)
  const [away, setAway] = useState(false)
  const [partying, setPartying] = useState(false)
  const taps = useRef({ count: 0, last: 0 })

  useEffect(() => {
    setSide(Math.random() < 0.5 ? 'left' : 'right')
  }, [])

  useEffect(() => onOiiaChange(setPartying), [])

  useEffect(() => {
    const onWalk = (event) => setAway(event.detail)
    window.addEventListener('kitten-snowball', onWalk)
    return () => window.removeEventListener('kitten-snowball', onWalk)
  }, [])

  useEffect(() => {
    const media = window.matchMedia(WIDE_QUERY)
    const apply = () => {
      pose.current = media.matches ? POSES.wide : POSES.phone
      if (!busy.current) body.set({ y: reduceMotion ? pose.current.peek : pose.current.rest })
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [body, reduceMotion])

  useEffect(() => {
    if (reduceMotion || !side) return undefined
    let timer = null
    let alive = true
    const peek = async () => {
      if (!busy.current && !hovering.current) {
        busy.current = true
        await body.start({ y: pose.current.peek, rotate: side === 'left' ? 6 : -6, transition: { type: 'spring', stiffness: 220, damping: 16 } })
        await new Promise((resolve) => setTimeout(resolve, random(1600, 3200)))
        if (alive && !hovering.current) await body.start({ y: pose.current.rest, rotate: 0, transition: { duration: 0.35, ease: 'easeIn' } })
        busy.current = false
      }
      if (alive) timer = setTimeout(peek, random(5000, 11000))
    }
    timer = setTimeout(peek, random(1500, 3000))
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [reduceMotion, body, side])

  const pet = async () => {
    const now = Date.now()
    const tally = taps.current
    tally.count = now - tally.last < TAP_GAP_MS ? tally.count + 1 : 1
    tally.last = now
    if (tally.count >= OIIA_TAPS) {
      tally.count = 0
      startOiia()
      return
    }
    showMood('happy', 1200)
    playMew()
    burst(5, 26)
    if (reduceMotion || busy.current) return
    busy.current = true
    await body.start({
      y: [pose.current.rest, JUMP_Y, pose.current.peek],
      rotate: [0, side === 'left' ? -12 : 12, 0],
      transition: { duration: 0.6, times: [0, 0.45, 1], ease: 'easeOut' },
    })
    await new Promise((resolve) => setTimeout(resolve, 1400))
    await body.start(
      hovering.current
        ? { y: '-6%', rotate: 0, transition: { type: 'spring', stiffness: 220, damping: 16 } }
        : { y: pose.current.rest, transition: { duration: 0.35, ease: 'easeIn' } },
    )
    busy.current = false
  }

  const caught = async () => {
    clearTimeout(leaveTimer.current)
    if (reduceMotion || pose.current !== POSES.wide || hovering.current) return
    hovering.current = true
    if (busy.current) return
    const lean = side === 'left' ? 1 : -1
    const spring = { type: 'spring', stiffness: 260, damping: 15 }
    const reaction = Math.floor(random(0, 4))
    if (reaction === 0) {
      body.start({ y: '-2%', rotate: lean * 22, transition: spring })
    } else if (reaction === 1) {
      showMood('wink', 6000)
      body.start({ y: '-4%', rotate: lean * 6, transition: spring })
    } else if (reaction === 2) {
      await body.start({ y: '62%', rotate: 0, transition: { duration: 0.14, ease: 'easeIn' } })
      if (!hovering.current) return
      showMood('happy', 900)
      body.start({ y: '-5%', rotate: -lean * 18, transition: { ...spring, stiffness: 160 } })
    } else {
      body.start({ y: '-6%', rotate: lean * 4, transition: spring })
    }
  }

  const release = () => {
    if (!hovering.current) return
    clearTimeout(leaveTimer.current)
    leaveTimer.current = setTimeout(() => {
      hovering.current = false
      showMood('look', 1)
      if (!busy.current) body.start({ y: pose.current.rest, rotate: 0, transition: { duration: 0.3, ease: 'easeIn' } })
    }, 500)
  }

  return (
    <div className={`pointer-events-none relative h-10 transition-opacity duration-300 sm:h-0 ${away || partying || !side ? 'invisible opacity-0' : ''}`}>
      <div
        className={`pointer-events-auto absolute bottom-0 h-20 w-20 translate-y-1/2 sm:h-14 sm:w-14 ${side === 'left' ? 'left-[8%]' : 'right-[8%]'}`}
        onMouseEnter={caught}
        onMouseLeave={release}
      >
        <KittenHearts items={hearts} className="bottom-16 h-3.5 w-3.5 sm:bottom-12 sm:h-3 sm:w-3" />
        <motion.button
          ref={faceRef}
          type="button"
          onClick={pet}
          aria-label={t('account.petKitten')}
          initial={{ y: POSES.wide.rest }}
          animate={body}
          style={{ originY: 1 }}
          className="block h-full w-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green"
        >
          <KittenFace mood={mood} look={look} className="h-full w-full" />
        </motion.button>
      </div>
      <div
        aria-hidden
        className={`pointer-events-auto absolute bottom-0 z-20 hidden h-10 w-16 translate-y-1/2 cursor-pointer sm:block ${side === 'left' ? 'left-[calc(8%-4px)]' : 'right-[calc(8%-4px)]'}`}
        onMouseEnter={caught}
        onMouseLeave={release}
        onClick={pet}
      />
    </div>
  )
}
