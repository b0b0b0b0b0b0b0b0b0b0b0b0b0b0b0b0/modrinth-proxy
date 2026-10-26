'use client'

import { useRef, useState } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { KittenFace, KittenHearts, useKittenHearts, useKittenMood, useKittenSeason } from '../components/Kitten'
import { useT } from '../components/I18nProvider'
import { playTrill } from '../components/softSounds'

export default function ExtensionKitten() {
  const t = useT()
  const reduceMotion = useReducedMotion()
  const faceRef = useRef(null)
  const hop = useAnimationControls()
  const { look, mood, showMood } = useKittenMood(!reduceMotion, faceRef)
  const { hearts, burst } = useKittenHearts()
  const spooky = useKittenSeason() === 'halloween'
  const [tap, setTap] = useState(0)

  const pet = () => {
    showMood('happy', 1000)
    playTrill()
    burst(5, 26)
    setTap((n) => n + 1)
    if (!reduceMotion) {
      hop.start({
        y: [0, -14, 0, -4, 0],
        rotate: [0, Math.random() < 0.5 ? -10 : 10, 0, 0, 0],
        transition: { duration: 0.6, times: [0, 0.35, 0.6, 0.8, 1], ease: 'easeOut' },
      })
    }
  }

  return (
    <div className="absolute -top-10 right-5 z-10 h-12 w-12 sm:-top-11 sm:right-8 sm:h-14 sm:w-14">
      <KittenHearts items={hearts} className="bottom-10 h-3 w-3" />
      <motion.button
        ref={faceRef}
        type="button"
        onClick={pet}
        aria-label={t('account.petKitten')}
        animate={hop}
        style={{ originY: 0.9 }}
        className="block h-full w-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green"
      >
        <motion.div
          animate={reduceMotion ? undefined : { scaleY: [1, 1.035, 1], scaleX: [1, 0.985, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originY: 0.9 }}
        >
          <KittenFace mood={mood} look={look} className="h-12 w-12 sm:h-14 sm:w-14" />
        </motion.div>
      </motion.button>
      <svg
        className={`pointer-events-none absolute left-0 top-[80%] h-auto w-full overflow-visible ${spooky ? 'text-[#f08a24]' : 'text-modrinth-green'}`}
        viewBox="0 0 24 8"
        aria-hidden
      >
        {[8.4, 15.6].map((cx, index) => (
          <motion.g
            key={`${cx}-${tap}`}
            initial={tap ? { y: 0 } : false}
            animate={reduceMotion || !tap ? undefined : { y: [0, -1.4, 0] }}
            transition={{ duration: 0.32, delay: index * 0.09, ease: 'easeOut' }}
          >
            <ellipse cx={cx} cy="4" rx="2.9" ry="2.2" fill="currentColor" className="stroke-modrinth-dark" strokeWidth="0.6" />
            <ellipse cx={cx} cy="4.6" rx="1.05" ry="0.75" fill="white" fillOpacity="0.45" />
            {[-1.2, 0, 1.2].map((dx) => (
              <circle key={dx} cx={cx + dx} cy={dx ? 2.8 : 2.5} r="0.42" fill="white" fillOpacity="0.45" />
            ))}
          </motion.g>
        ))}
      </svg>
    </div>
  )
}
