'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import { signInWithTelegram } from '@/lib/telegramPopup'
import DeleteAccount from './DeleteAccount'
import GamePicker from './GamePicker'

const GAME_LOADERS = ['fabric', 'forge', 'neoforge', 'quilt']
const SERVER_CORES = ['paper', 'purpur', 'spigot', 'folia', 'velocity', 'bungeecord']
const PROFILE_PAYLOAD = { loader: 'gameLoader', gameVersion: 'gameVersion', serverCore: 'serverCore', serverVersion: 'serverVersion' }
import { getLoaderDisplayName } from '@/lib/loaders'
import { NEWS_BADGE_EVENT } from '../components/NewsCounter'
import { onSoundsMutedChange, playChime, playPoof, setSoundsMuted, soundsMuted } from '../components/softSounds'
import { isHalloweenSeason, onGhostTurboChange, readGhostTurbo, setGhostTurbo } from '@/lib/halloween'
import { isNewYearSeason, onSnowTurboChange, readSnowTurbo, setSnowTurbo } from '@/lib/newYear'
import { ClearFavoritesButton, ClearHistoryButton } from './FavoriteActions'
import { announceFestiveChange, onFestiveChange } from '@/lib/festive'

const LINK_BUTTON =
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-modrinth-green px-2.5 py-1.5 text-xs font-bold leading-none text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'
const GHOST_BUTTON =
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-800 px-2.5 py-1.5 text-xs font-semibold leading-none text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white disabled:opacity-50'

function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? 'bg-modrinth-green' : 'bg-gray-700'}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  )
}

function Setting({ title, hint, nested, children }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${nested ? 'py-2' : 'py-3'}`}>
      <div className="min-w-0">
        <div className={`${nested ? 'text-[13px]' : 'text-sm'} font-semibold text-white`}>{title}</div>
        {hint ? <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-500">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-800 bg-[var(--bg-primary)] px-4 py-1">
      <h2 className="pt-3 text-[11px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">{title}</h2>
      <div className="divide-y divide-gray-800">{children}</div>
    </section>
  )
}

export default function AccountSettings({
  telegram,
  trackDownloads: initialTrack,
  recordHistory: initialRecord,
  newsBadge: initialNewsBadge,
  festive: initialFestive,
  mutedCount,
  counts,
  deletion,
  game,
}) {
  const t = useT()
  const router = useRouter()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [notify, setNotify] = useState(telegram.notify)
  const [trackDownloads, setTrackDownloads] = useState(initialTrack)
  const [recordHistory, setRecordHistory] = useState(initialRecord)
  const [newsBadge, setNewsBadge] = useState(initialNewsBadge)
  const [festive, setFestive] = useState(initialFestive)
  const [kittenSounds, setKittenSounds] = useState(true)

  useEffect(() => {
    setKittenSounds(!soundsMuted())
    return onSoundsMutedChange((muted) => setKittenSounds(!muted))
  }, [])
  const [halloween, setHalloween] = useState(false)
  const [ghostTurbo, setGhostTurboState] = useState(false)

  useEffect(() => {
    setHalloween(isHalloweenSeason())
    setGhostTurboState(readGhostTurbo())
    return onGhostTurboChange(setGhostTurboState)
  }, [])
  const [newYear, setNewYear] = useState(false)
  const [snowTurbo, setSnowTurboState] = useState(false)

  useEffect(() => {
    setNewYear(isNewYearSeason())
    setSnowTurboState(readSnowTurbo())
    return onSnowTurboChange(setSnowTurboState)
  }, [])

  useEffect(
    () =>
      onFestiveChange(() => {
        setHalloween(isHalloweenSeason())
        setNewYear(isNewYearSeason())
      }),
    [],
  )
  const [profile, setProfile] = useState(game.chosen)
  const [gameVersions, setGameVersions] = useState([])

  useEffect(() => {
    let alive = true
    fetch('/api/mc-versions')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (alive && Array.isArray(data?.release)) setGameVersions(data.release)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const save = async (key, payload, apply, revert) => {
    if (busy) return
    setBusy(key)
    setError('')
    apply()
    try {
      const response = await fetch('/api/account/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        revert()
        setError(t('account.errGeneric'))
        return false
      }
      return true
    } catch {
      revert()
      setError(t('account.errGeneric'))
      return false
    } finally {
      setBusy(null)
    }
  }

  const linkTelegram = async () => {
    if (busy) return
    setBusy('link')
    setError('')
    const outcome = await signInWithTelegram(telegram.botId, null)
    setBusy(null)
    if (outcome.result === 'linked' || outcome.result === 'session') router.refresh()
    else if (outcome.result === 'error') {
      setError(t(outcome.error === 'taken' ? 'account.telegramTaken' : 'account.errTelegram'))
    }
  }

  return (
    <div className="space-y-3">
      {telegram.botId ? (
        <Section title="Telegram">
          <Setting title={t('tg.notifyTitle')} hint={t(telegram.linked ? 'tg.notifyHint' : 'tg.notifyNeedLink')}>
            {telegram.linked ? (
              <Switch
                checked={notify}
                label={t('tg.notifyTitle')}
                disabled={Boolean(busy)}
                onChange={() =>
                  save('notify', { telegram: !notify }, () => setNotify(!notify), () => setNotify(notify))
                }
              />
            ) : (
              <button type="button" onClick={linkTelegram} disabled={Boolean(busy)} className={LINK_BUTTON}>
                {t('account.telegramLink')}
              </button>
            )}
          </Setting>
        </Section>
      ) : null}

      <Section title={t('set.gameTitle')}>
        <div className="py-3">
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-500">{t('set.gameHint')}</p>
          {[
            { title: t('set.modsTitle'), core: 'loader', version: 'gameVersion', coreLabel: t('set.loader'), versionLabel: t('set.gameVersion'), cores: GAME_LOADERS },
            { title: t('set.pluginsTitle'), core: 'serverCore', version: 'serverVersion', coreLabel: t('set.serverCore'), versionLabel: t('set.serverVersion'), cores: SERVER_CORES },
          ].map((group) => (
            <div key={group.core} className="mt-4">
              <div className="mb-2 text-sm font-semibold text-white">{group.title}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    key: group.core,
                    label: group.coreLabel,
                    options: group.cores.map((id) => ({ value: id, label: getLoaderDisplayName(id) })),
                    hint: game.guess[group.core] ? getLoaderDisplayName(game.guess[group.core]) : null,
                  },
                  {
                    key: group.version,
                    label: group.versionLabel,
                    search: true,
                    options: [
                      ...(profile[group.version] && !gameVersions.includes(profile[group.version])
                        ? [{ value: profile[group.version], label: profile[group.version] }]
                        : []),
                      ...gameVersions.map((version) => ({ value: version, label: version })),
                    ],
                    hint: game.guess[group.version] || null,
                  },
                ].map((field) => (
                  <GamePicker
                    key={field.key}
                    label={field.label}
                    value={profile[field.key]}
                    disabled={Boolean(busy)}
                    searchPlaceholder={field.search ? t('set.versionSearch') : undefined}
                    emptyText={t('set.versionNotFound')}
                    options={[{ value: '', label: t('set.auto'), hint: field.hint }, ...field.options]}
                    onChange={(next) =>
                      save(
                        field.key,
                        { [PROFILE_PAYLOAD[field.key]]: next },
                        () => setProfile((current) => ({ ...current, [field.key]: next })),
                        () => setProfile((current) => ({ ...current, [field.key]: profile[field.key] })),
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ))}
          {Object.values(game.guess).some(Boolean) || Object.values(profile).some(Boolean) ? null : (
            <p className="mt-3 text-[11px] text-gray-600 dark:text-gray-500">{t('set.notGuessed')}</p>
          )}
        </div>
      </Section>

      <Section title={t('account.updates')}>
        <Setting title={t('set.trackDownloads')} hint={t('set.trackDownloadsHint')}>
          <Switch
            checked={trackDownloads}
            label={t('set.trackDownloads')}
            disabled={Boolean(busy)}
            onChange={() =>
              save(
                'track',
                { trackDownloads: !trackDownloads },
                () => setTrackDownloads(!trackDownloads),
                () => setTrackDownloads(trackDownloads),
              ).then((ok) => ok && router.refresh())
            }
          />
        </Setting>
        {mutedCount > 0 ? (
          <Setting title={t('set.mutedTitle', { n: mutedCount })} hint={t('set.mutedHint')}>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => save('unmute', { unmuteAll: true }, () => {}, () => {}).then((ok) => ok && router.refresh())}
              className={GHOST_BUTTON}
            >
              {t('set.unmuteAll')}
            </button>
          </Setting>
        ) : null}
      </Section>

      <Section title={t('account.downloads')}>
        <Setting title={t('set.recordHistory')} hint={t('set.recordHistoryHint')}>
          <Switch
            checked={recordHistory}
            label={t('set.recordHistory')}
            disabled={Boolean(busy)}
            onChange={() =>
              save(
                'record',
                { recordHistory: !recordHistory },
                () => setRecordHistory(!recordHistory),
                () => setRecordHistory(recordHistory),
              )
            }
          />
        </Setting>
      </Section>

      <Section title={t('set.siteTitle')}>
        <Setting title={t('set.newsBadge')} hint={t('set.newsBadgeHint')}>
          <Switch
            checked={newsBadge}
            label={t('set.newsBadge')}
            disabled={Boolean(busy)}
            onChange={() =>
              save(
                'news',
                { newsBadge: !newsBadge },
                () => setNewsBadge(!newsBadge),
                () => setNewsBadge(newsBadge),
              ).then(() => window.dispatchEvent(new Event(NEWS_BADGE_EVENT)))
            }
          />
        </Setting>
        <div>
          <Setting title={t('set.festive')} hint={t('set.festiveHint')}>
            <Switch
              checked={festive}
              label={t('set.festive')}
              disabled={Boolean(busy)}
              onChange={() =>
                save(
                  'festive',
                  { festive: !festive },
                  () => setFestive(!festive),
                  () => setFestive(festive),
                ).then((ok) => ok && announceFestiveChange())
              }
            />
          </Setting>
          {halloween || newYear ? (
            <div className="mb-3 ml-1 space-y-1 border-l-2 border-modrinth-green/30 pl-4">
              {halloween ? (
                <Setting nested title={t('set.ghostTurbo')} hint={t('set.ghostTurboHint')}>
                  <Switch
                    checked={ghostTurbo}
                    label={t('set.ghostTurbo')}
                    onChange={() => {
                      setGhostTurbo(!ghostTurbo)
                      if (!ghostTurbo) playPoof()
                    }}
                  />
                </Setting>
              ) : null}
              {newYear ? (
                <Setting nested title={t('set.snowTurbo')} hint={t('set.snowTurboHint')}>
                  <Switch
                    checked={snowTurbo}
                    label={t('set.snowTurbo')}
                    onChange={() => {
                      setSnowTurbo(!snowTurbo)
                      if (!snowTurbo) playChime()
                    }}
                  />
                </Setting>
              ) : null}
            </div>
          ) : null}
        </div>
        <Setting title={t('set.kittenSounds')} hint={t('set.kittenSoundsHint')}>
          <Switch
            checked={kittenSounds}
            label={t('set.kittenSounds')}
            onChange={() => {
              setSoundsMuted(kittenSounds)
              if (!kittenSounds) playChime()
            }}
          />
        </Setting>
      </Section>

      {counts.favorites > 0 || counts.downloads > 0 ? (
        <Section title={t('set.cleanupTitle')}>
          {counts.favorites > 0 ? (
            <Setting title={t('account.favorites')} hint={t('set.clearFavoritesHint', { n: counts.favorites })}>
              <ClearFavoritesButton count={counts.favorites} />
            </Setting>
          ) : null}
          {counts.downloads > 0 ? (
            <Setting title={t('account.downloads')} hint={t('set.clearHistoryHint', { n: counts.downloads })}>
              <ClearHistoryButton count={counts.downloads} />
            </Setting>
          ) : null}
        </Section>
      ) : null}

      {error ? (
        <p className="text-xs text-amber-600 dark:text-amber-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="pt-6">
        <DeleteAccount {...deletion} />
      </div>
    </div>
  )
}
