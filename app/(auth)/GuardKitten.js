'use client'

import { useRef } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { KittenFace, KittenHearts, useKittenHearts, useKittenMood } from '../components/Kitten'
import { useT } from '../components/I18nProvider'
import { playTrill } from '../components/softSounds'

const USERNAME_MAX = 24

export default function GuardKitten({ field, reveal, typed }) {
  const t = useT()
  const reduceMotion = useReducedMotion()
  const faceRef = useRef(null)
  const hop = useAnimationControls()
  const { look, mood, showMood } = useKittenMood(!reduceMotion, faceRef)
  const { hearts, burst } = useKittenHearts()

  const reading = field === 'username'
  const paws = field === 'password' ? (reveal ? 'peek' : 'cover') : null
  const eyes = reading ? { x: -0.8 + Math.min(1, typed / USERNAME_MAX) * 1.6, y: 0.9 } : look

  const pet = () => {
    showMood('happy', 1000)
    playTrill()
    burst(5, 24)
    if (!reduceMotion) {
      hop.start({
        y: [0, -10, 0, -3, 0],
        scaleY: [1, 1.06, 0.9, 1.02, 1],
        transition: { duration: 0.55, times: [0, 0.35, 0.6, 0.8, 1], ease: 'easeOut' },
      })
    }
  }

  return (
    <div className="relative h-14 w-14 shrink-0">
      <KittenHearts items={hearts} className="bottom-10 h-3 w-3" />
      <motion.button
        ref={faceRef}
        type="button"
        onClick={pet}
        aria-label={t('account.petKitten')}
        animate={hop}
        style={{ originY: 0.9 }}
        className="block h-14 w-14 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green"
      >
        <motion.div
          animate={reduceMotion ? undefined : { rotate: paws ? -4 : reading ? 3 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <KittenFace mood={paws ? 'look' : mood} look={paws ? { x: 0.6, y: 0.4 } : eyes} paws={paws} className="h-14 w-14" />
        </motion.div>
      </motion.button>
    </div>
  )
}
