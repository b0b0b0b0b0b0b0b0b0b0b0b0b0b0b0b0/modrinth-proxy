'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { syncGameProfile } from '@/lib/gameProfileSync'
import { getLoaderDisplayName } from '@/lib/loaders'
import { KittenFace } from './Kitten'
import { useT } from './I18nProvider'

function joinParts(loader, version) {
  return [loader ? getLoaderDisplayName(loader) : '', version || ''].filter(Boolean).join(', ')
}

export default function GameProfileSync() {
  const t = useT()
  const pathname = usePathname()
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const signedRef = useRef(false)
  const [imported, setImported] = useState(null)

  useEffect(() => {
    const signed = document.cookie.includes('mp_signed=1')
    if (signed && !signedRef.current) {
      syncGameProfile().then((changes) => {
        if (!changes) return
        setImported(changes)
        router.refresh()
      })
    }
    signedRef.current = signed
  }, [pathname])

  const mods = imported ? joinParts(imported.gameLoader, imported.gameVersion) : ''
  const plugins = imported ? joinParts(imported.serverCore, imported.serverVersion) : ''

  return (
    <AnimatePresence>
      {imported ? (
        <motion.div
          role="status"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-[70] rounded-2xl border border-modrinth-green/30 bg-modrinth-dark p-4 shadow-2xl sm:right-auto sm:w-[380px] lg:bottom-6"
        >
          <div className="flex gap-3">
            <KittenFace mood="happy" className="h-12 w-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm font-bold text-white">{t('gp.title')}</p>
              <p className="m-0 mt-1 text-xs leading-relaxed text-gray-400">{t('gp.text')}</p>
              <ul className="m-0 mt-2 list-none space-y-0.5 p-0 text-xs font-semibold text-modrinth-green">
                {mods ? <li>{t('gp.mods', { value: mods })}</li> : null}
                {plugins ? <li>{t('gp.plugins', { value: plugins })}</li> : null}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/settings/profile"
                  onClick={() => setImported(null)}
                  className="rounded-lg bg-modrinth-green px-3 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90"
                >
                  {t('gp.change')}
                </Link>
                <button
                  type="button"
                  onClick={() => setImported(null)}
                  className="rounded-lg border border-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white"
                >
                  {t('gp.close')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
