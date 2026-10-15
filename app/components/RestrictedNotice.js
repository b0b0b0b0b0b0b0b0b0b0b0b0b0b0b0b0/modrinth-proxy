'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { KittenFace, KittenHearts, useKittenHearts, useKittenMood } from './Kitten'
import { useT } from './I18nProvider'
import { playBloop } from './softSounds'

function Padlock({ controls, reduceMotion }) {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-[70px] -ml-4 h-10 w-8"
      style={{ originX: 0.5, originY: 0 }}
      animate={reduceMotion ? undefined : { rotate: [-7, 7, -7] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.svg animate={controls} viewBox="0 0 32 40" className="h-10 w-8 text-modrinth-green" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M16 0v6" strokeWidth="1.5" />
        <path d="M10 17v-4a6 6 0 0 1 12 0v4" />
        <rect x="6" y="17" width="20" height="17" rx="4" className="fill-modrinth-green" stroke="none" />
        <circle cx="16" cy="24" r="2.2" fill="white" fillOpacity="0.85" stroke="none" />
        <path d="M16 25.5v3.5" stroke="white" strokeOpacity="0.85" strokeWidth="2" />
      </motion.svg>
    </motion.div>
  )
}

export default function RestrictedNotice({ title, kid, details = [], href = '/', backLabel }) {
  const t = useT()
  const reduceMotion = useReducedMotion()
  const faceRef = useRef(null)
  const hop = useAnimationControls()
  const lock = useAnimationControls()
  const { look, mood, showMood } = useKittenMood(!reduceMotion, faceRef)
  const { hearts, burst } = useKittenHearts()

  const tryOpen = () => {
    playBloop()
    showMood('blink', 260)
    setTimeout(() => showMood('happy', 900), 280)
    setTimeout(() => burst(4, 28), 300)
    if (!reduceMotion) {
      lock.start({ x: [0, -3, 3, -2, 2, 0], rotate: [0, -10, 10, -6, 6, 0], transition: { duration: 0.45 } })
      hop.start({ y: [0, -6, 0], transition: { duration: 0.35, ease: 'easeOut' } })
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <div className="relative mx-auto h-28 w-24">
        <KittenHearts items={hearts} className="bottom-24 h-4 w-4" />
        <motion.button
          ref={faceRef}
          type="button"
          onClick={tryOpen}
          aria-label={t('account.petKitten')}
          animate={hop}
          className="block h-24 w-24 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green"
        >
          <KittenFace earsDown mood={mood} look={mood === 'look' ? { x: look.x * 0.5, y: -0.7 } : look} className="h-24 w-24" />
        </motion.button>
        <Padlock controls={lock} reduceMotion={reduceMotion} />
      </div>

      <h1 className="mt-6 text-2xl font-bold text-white md:text-3xl">{title}</h1>
      {kid ? <p className="mx-auto mt-2 max-w-md text-base text-gray-400">{kid}</p> : null}

      {details.length ? (
        <div className="mt-6 rounded-xl border border-gray-800 bg-modrinth-dark p-5 text-left">
          {details.map((line, index) => (
            <p key={index} className={index ? 'mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-500' : 'text-sm leading-relaxed text-gray-400'}>
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {backLabel ? (
        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-modrinth-green px-5 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
            <path d="M19 12H5m7 7-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
      ) : null}
    </div>
  )
}
