'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { KittenFace, KittenHearts, useKittenHearts, useKittenMood } from './Kitten'
import { useT } from './I18nProvider'
import { playChime } from './softSounds'

const FOUND_GLANCES = [
  { x: -0.5, y: 0.9 },
  { x: 0.2, y: 1 },
  { x: -0.2, y: 0.8 },
]
const GLANCES = [
  { x: -1, y: -0.2 },
  { x: 1, y: -0.2 },
  { x: -0.6, y: 0.5 },
  { x: 0.7, y: 0.4 },
  { x: 0, y: -0.9 },
]

export default function LostKitten({ text, found = false, className = '' }) {
  const t = useT()
  const reduceMotion = useReducedMotion()
  const faceRef = useRef(null)
  const hop = useAnimationControls()
  const { mood, showMood } = useKittenMood(!reduceMotion, faceRef)
  const { hearts, burst } = useKittenHearts()
  const [glance, setGlance] = useState(0)

  useEffect(() => {
    if (reduceMotion) return undefined
    const timer = setInterval(() => setGlance((current) => current + 1), found ? 1500 : 1100)
    return () => clearInterval(timer)
  }, [reduceMotion, found])

  const pet = () => {
    showMood('happy', 1000)
    playChime()
    burst(5, 30)
    if (!reduceMotion) {
      hop.start({
        y: [0, -16, 0, -4, 0],
        scaleY: [1, 1.07, 0.88, 1.02, 1],
        transition: { duration: 0.6, times: [0, 0.35, 0.6, 0.8, 1], ease: 'easeOut' },
      })
    }
  }

  const glances = found ? FOUND_GLANCES : GLANCES
  const look = glances[glance % glances.length]
  const size = found ? 'h-16 w-16' : 'h-24 w-24'

  const kitten = (
    <div className={`relative shrink-0 ${size}`}>
      <KittenHearts items={hearts} className="bottom-16 h-4 w-4" />
      {!reduceMotion ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-2 text-2xl font-black text-modrinth-green"
          animate={{ y: [0, -5, 0], rotate: [-8, 8, -8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {found ? '!' : '?'}
        </motion.span>
      ) : null}
      <motion.button
        ref={faceRef}
        type="button"
        onClick={pet}
        aria-label={t('account.petKitten')}
        animate={hop}
        style={{ originY: 0.9 }}
        className={`block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green ${size}`}
      >
        <motion.div
          animate={reduceMotion ? undefined : { rotate: look.x * 7 }}
          transition={{ type: 'spring', stiffness: 160, damping: 14 }}
        >
          <KittenFace mood={mood} look={look} className={size} />
        </motion.div>
      </motion.button>
    </div>
  )

  if (found) return <div className={className}>{kitten}</div>

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-6 text-center">
      {kitten}
      <p className="mt-4 text-xl text-gray-400">{text}</p>
    </div>
  )
}
