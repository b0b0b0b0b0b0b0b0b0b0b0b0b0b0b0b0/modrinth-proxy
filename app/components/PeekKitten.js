'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { KittenFace, KittenHearts, useKittenHearts, useKittenMood } from './Kitten'
import { useT } from './I18nProvider'
import { playMew } from './softSounds'

const HIDDEN_Y = '-5%'
const PEEK_Y = '-25%'
const JUMP_Y = '-64%'
const random = (min, max) => min + Math.random() * (max - min)

export default function PeekKitten() {
  const t = useT()
  const reduceMotion = useReducedMotion()
  const faceRef = useRef(null)
  const body = useAnimationControls()
  const { look, mood, showMood } = useKittenMood(!reduceMotion, faceRef)
  const { hearts, burst } = useKittenHearts()
  const [side] = useState(() => (Math.random() < 0.5 ? 'left' : 'right'))
  const busy = useRef(false)

  useEffect(() => {
    if (reduceMotion) return undefined
    let timer = null
    let alive = true
    const peek = async () => {
      if (!busy.current) {
        busy.current = true
        await body.start({ y: PEEK_Y, rotate: side === 'left' ? 6 : -6, transition: { type: 'spring', stiffness: 220, damping: 16 } })
        await new Promise((resolve) => setTimeout(resolve, random(1600, 3200)))
        if (alive) await body.start({ y: HIDDEN_Y, rotate: 0, transition: { duration: 0.35, ease: 'easeIn' } })
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
    showMood('happy', 1200)
    playMew()
    burst(5, 26)
    if (reduceMotion || busy.current) return
    busy.current = true
    await body.start({
      y: [HIDDEN_Y, JUMP_Y, PEEK_Y],
      rotate: [0, side === 'left' ? -12 : 12, 0],
      transition: { duration: 0.6, times: [0, 0.45, 1], ease: 'easeOut' },
    })
    await new Promise((resolve) => setTimeout(resolve, 1400))
    await body.start({ y: HIDDEN_Y, transition: { duration: 0.35, ease: 'easeIn' } })
    busy.current = false
  }

  return (
    <div className="pointer-events-none relative h-10 sm:h-0">
      <div
        className={`pointer-events-auto absolute bottom-0 h-20 w-20 translate-y-1/2 sm:h-14 sm:w-14 ${side === 'left' ? 'left-[8%]' : 'right-[8%]'}`}
      >
        <KittenHearts items={hearts} className="bottom-16 h-3.5 w-3.5 sm:bottom-12 sm:h-3 sm:w-3" />
        <motion.button
          ref={faceRef}
          type="button"
          onClick={pet}
          aria-label={t('account.petKitten')}
          initial={{ y: reduceMotion ? PEEK_Y : HIDDEN_Y }}
          animate={body}
          style={{ originY: 1 }}
          className="block h-full w-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green"
        >
          <KittenFace mood={mood} look={look} className="h-full w-full" />
        </motion.button>
      </div>
    </div>
  )
}
