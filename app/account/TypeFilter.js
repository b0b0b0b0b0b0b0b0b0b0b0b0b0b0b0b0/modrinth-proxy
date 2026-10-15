'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

export default function TypeFilter({ items, active, tab }) {
  const reduceMotion = useReducedMotion()
  if (items.length < 3) return null

  return (
    <div className="mb-3 overflow-x-auto">
      <nav className="relative flex w-fit rounded-full bg-[var(--bg-primary)] p-1 text-sm font-bold">
        {items.map((item) => {
          const selected = item.id === active
          return (
            <Link
              key={item.id}
              href={item.id ? `/account?tab=${tab}&type=${item.id}` : `/account?tab=${tab}`}
              scroll={false}
              aria-current={selected ? 'page' : undefined}
              className={`relative z-[1] flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 transition-colors ${
                selected ? 'text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {selected ? (
                <motion.span
                  layoutId={`type-filter-${tab}`}
                  className="absolute inset-0 -z-[1] rounded-full bg-modrinth-green"
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                />
              ) : null}
              {item.label}
              <span className={`text-[11px] font-semibold ${selected ? 'text-black/60' : 'text-gray-600 dark:text-gray-500'}`}>
                {item.count}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
