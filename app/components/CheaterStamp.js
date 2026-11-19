'use client'

import { useEffect, useRef, useState } from 'react'

const HOLD_MS = 2600
const FLY_MS = 850
const TILT = 'rotate(-5deg)'
const SEEN_KEY = 'mp-busted-intro'

function StampText({ text }) {
  const width = Math.min(94, Math.max(40, text.length * 10.5))
  return (
    <svg viewBox="0 0 100 24" focusable="false">
      <text x="50" y="12.5" textLength={width} lengthAdjust="spacingAndGlyphs">
        {text}
      </text>
    </svg>
  )
}

export function CheaterStamp({ text }) {
  return (
    <span className="busted-stamp" aria-hidden="true">
      <span className="busted-stamp__band">
        <StampText text={text} />
      </span>
    </span>
  )
}

export function CheaterScreen({ text }) {
  const rootRef = useRef(null)
  const dimRef = useRef(null)
  const bandRef = useRef(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    let seen = false
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
      seen = false
    }
    if (seen) document.querySelector('.busted-stamp')?.classList.add('is-landed')
    else setShow(true)
  }, [])

  useEffect(() => {
    if (!show) return
    const stamp = document.querySelector('.busted-stamp')
    const land = () => {
      try {
        window.sessionStorage.setItem(SEEN_KEY, '1')
      } catch {}
      stamp?.classList.add('is-landed')
      setShow(false)
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      land()
      return
    }
    let flight = null
    const timer = window.setTimeout(() => {
      const root = rootRef.current
      const band = bandRef.current
      const target = stamp?.getBoundingClientRect()
      if (!root || !band || !target || target.width === 0) {
        land()
        return
      }
      const big = Math.min(window.innerWidth * 0.8, 920)
      const scale = (target.width * 0.86) / big
      const dx = target.left + target.width / 2 - window.innerWidth / 2
      const dy = target.top + target.height / 2 - window.innerHeight / 2
      const timing = { duration: FLY_MS, easing: 'cubic-bezier(0.65, 0, 0.2, 1)', fill: 'forwards' }
      dimRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], timing)
      root.animate([{ backdropFilter: 'grayscale(1)' }, { backdropFilter: 'grayscale(0)' }], timing)
      flight = band.animate(
        [{ transform: `${TILT} scale(1)` }, { transform: `translate(${dx}px, ${dy}px) ${TILT} scale(${scale})` }],
        timing,
      )
      flight.onfinish = land
    }, HOLD_MS)
    return () => {
      window.clearTimeout(timer)
      flight?.cancel()
    }
  }, [show])

  if (!show) return null
  return (
    <div className="busted-screen" aria-hidden="true" ref={rootRef}>
      <div className="busted-screen__dim" ref={dimRef} />
      <div className="busted-screen__band" ref={bandRef}>
        <StampText text={text} />
      </div>
    </div>
  )
}
