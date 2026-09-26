'use client'

import { useMemo } from 'react'
import { useMinecraftVersions } from '../hooks/useMinecraftVersions'
import { getModsVersionRange } from '@/lib/minecraftVersionRange'
import { useT } from '../components/I18nProvider'

function Version({ children }) {
  return <span className="font-semibold text-modrinth-green">{children}</span>
}

export default function LauncherVersions() {
  const t = useT()
  const { release, full, loading } = useMinecraftVersions()
  const { toVersion, snapshotVersion } = useMemo(
    () => getModsVersionRange(release, full),
    [release, full]
  )

  return (
    <section className="max-w-7xl mx-auto px-4 my-20">
      <div className="feature gradient-border relative overflow-hidden rounded-3xl border border-gray-700/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-8 md:p-14 shadow-2xl">
        <div className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[28rem] -translate-x-1/2 rounded-full bg-modrinth-green/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
            <span className="text-modrinth-green">{t('app.best')}</span> {t('app.bestRest')}
          </h2>
          <p className="mt-5 text-lg text-gray-300 leading-relaxed">
            {t('app.bestP1')}
            {!loading && toVersion ? (
              <> {t('app.bestToLatest')} <Version>{toVersion}</Version></>
            ) : (
              <> {t('app.bestToLatestGeneric')}</>
            )}
            {t('app.bestP2')}
            {!loading && snapshotVersion ? (
              <>{t('app.bestSnap')} <Version>{snapshotVersion}</Version> {t('app.bestSnapWait')}</>
            ) : null}
            {t('app.bestP3')}
          </p>
        </div>
      </div>
    </section>
  )
}
