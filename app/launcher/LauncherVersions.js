'use client'

import { useMemo } from 'react'
import { useMinecraftVersions } from '../hooks/useMinecraftVersions'
import { getModsVersionRange } from '@/lib/minecraftVersionRange'

function Version({ children }) {
  return <span className="font-semibold text-modrinth-green">{children}</span>
}

export default function LauncherVersions() {
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
            <span className="text-modrinth-green">Лучший</span> лаунчер для модов Minecraft
          </h2>
          <p className="mt-5 text-lg text-gray-300 leading-relaxed">
            Скачай лучший лаунчер для Minecraft и открой доступ к тысячам модов, плагинов,
            шейдеров, ресурспаков и готовых модпаков под любую версию игры — от самых старых
            легендарных сборок
            {!loading && toVersion ? (
              <> до последней версии <Version>{toVersion}</Version></>
            ) : (
              <> до последних версий</>
            )}
            . Мы всегда держим руку на пульсе и добавляем поддержку новых версий сразу после
            выхода
            {!loading && snapshotVersion ? (
              <>, так что даже свежий снапшот <Version>{snapshotVersion}</Version> уже ждёт тебя</>
            ) : null}
            . Скачивай, устанавливай моды в пару кликов и играй в Minecraft так, как нравится
            именно тебе — всё лучшее в одном лаунчере.
          </p>
        </div>
      </div>
    </section>
  )
}
