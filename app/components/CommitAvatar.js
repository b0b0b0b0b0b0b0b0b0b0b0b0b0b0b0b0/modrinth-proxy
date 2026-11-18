'use client'

import { useState } from 'react'

export default function CommitAvatar({ src, name }) {
  const [broken, setBroken] = useState(!src)
  const letter = String(name || '?').charAt(0).toUpperCase()

  if (broken) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-modrinth-green to-modrinth-green-light text-xs font-bold text-white shadow-md">
        {letter}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      className="h-6 w-6 rounded-full shadow-md ring-1 ring-white/10"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  )
}
