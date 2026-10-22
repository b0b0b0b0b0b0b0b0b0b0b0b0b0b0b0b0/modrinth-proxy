'use client'

import { useRef } from 'react'
import { KittenFace, useKittenMood } from '../components/Kitten'

export default function RoyalKitten() {
  const faceRef = useRef(null)
  const { look, mood, showMood } = useKittenMood(true, faceRef)

  return (
    <div
      ref={faceRef}
      aria-hidden
      onClick={() => showMood('happy', 1100)}
      className="mx-auto h-16 w-16 cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
    >
      <KittenFace royal mood={mood} look={look} className="h-16 w-16" />
    </div>
  )
}
