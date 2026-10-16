'use client'

import { useRef, useState } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { KittenFace, KittenHearts, useKittenHearts, useKittenMood } from '../components/Kitten'
import { useT } from '../components/I18nProvider'
import { playMew, playTrill } from '../components/softSounds'

const SLEEP_ZS = [0, 1, 2]
const WAKE_MS = 2600

export function HeaderKitten() {
  const t = useT()
  const reduceMotion = useReducedMotion()
  const faceRef = useRef(null)
  const hop = useAnimationControls()
  const { look, mood, showMood } = useKittenMood(!reduceMotion, faceRef)
  const { hearts, burst } = useKittenHearts()

  const pet = () => {
    showMood('happy', 1000)
    playTrill()
    burst(5, 26)
    if (!reduceMotion) {
      hop.start({
        y: [0, -14, 0, -4, 0],
        rotate: [0, Math.random() < 0.5 ? -10 : 10, 0, 0, 0],
        scaleY: [1, 1.06, 0.88, 1.02, 1],
        transition: { duration: 0.6, times: [0, 0.35, 0.6, 0.8, 1], ease: 'easeOut' },
      })
    }
  }

  return (
    <div className="relative h-11 w-11 shrink-0">
      <KittenHearts items={hearts} className="bottom-8 h-3 w-3" />
      <motion.button
        ref={faceRef}
        type="button"
        onClick={pet}
        aria-label={t('account.petKitten')}
        animate={hop}
        style={{ originY: 0.9 }}
        className="block h-11 w-11 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green"
      >
        <motion.div
          animate={reduceMotion ? undefined : { scaleY: [1, 1.035, 1], scaleX: [1, 0.985, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originY: 0.9 }}
        >
          <KittenFace mood={mood} look={look} className="h-11 w-11" />
        </motion.div>
      </motion.button>
    </div>
  )
}

export function SleepyKitten({ text }) {
  const t = useT()
  const reduceMotion = useReducedMotion()
  const faceRef = useRef(null)
  const hop = useAnimationControls()
  const [awake, setAwake] = useState(false)
  const wakeTimer = useRef(null)
  const { look, mood, showMood } = useKittenMood(!reduceMotion && awake, faceRef, awake ? 'look' : 'sleep')
  const { hearts, burst } = useKittenHearts()

  const wake = () => {
    clearTimeout(wakeTimer.current)
    if (awake) {
      showMood('happy', 900)
      playTrill()
      burst(5, 30)
    } else {
      playMew()
      setAwake(true)
    }
    if (!reduceMotion) {
      hop.start({
        y: [0, -18, 0, -5, 0],
        scaleY: [1, 1.08, 0.86, 1.02, 1],
        transition: { duration: 0.65, times: [0, 0.35, 0.6, 0.8, 1], ease: 'easeOut' },
      })
    }
    wakeTimer.current = setTimeout(() => setAwake(false), WAKE_MS)
  }

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="relative h-20 w-20">
        <KittenHearts items={hearts} className="bottom-14 h-3.5 w-3.5" />
        {!awake && !reduceMotion
          ? SLEEP_ZS.map((index) => (
              <motion.span
                key={index}
                aria-hidden
                className="pointer-events-none absolute right-0 top-1 font-black text-modrinth-green"
                style={{ fontSize: 10 + index * 3 }}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], x: [0, 8 + index * 4, 14 + index * 6], y: [0, -14, -30 - index * 4] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.8, ease: 'easeOut' }}
              >
                z
              </motion.span>
            ))
          : null}
        <motion.button
          ref={faceRef}
          type="button"
          onClick={wake}
          aria-label={t('account.petKitten')}
          animate={hop}
          style={{ originY: 0.9 }}
          className="block h-20 w-20 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green"
        >
          <motion.div
            animate={reduceMotion ? undefined : { scaleY: awake ? 1 : [1, 1.05, 1], scaleX: awake ? 1 : [1, 0.98, 1] }}
            transition={{ duration: 3.2, repeat: awake ? 0 : Infinity, ease: 'easeInOut' }}
            style={{ originY: 0.9 }}
          >
            <KittenFace mood={awake ? mood : 'sleep'} look={look} className="h-20 w-20" />
          </motion.div>
        </motion.button>
      </div>
      <p className="mt-4 max-w-xs text-sm text-gray-600 dark:text-gray-500">{text}</p>
    </div>
  )
}
