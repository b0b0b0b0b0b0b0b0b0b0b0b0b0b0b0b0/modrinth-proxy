'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import { signInWithTelegram } from '@/lib/telegramPopup'
import GamePicker from './GamePicker'
import { useMinecraftVersions } from '../hooks/useMinecraftVersions'
import { rememberProfileField } from '@/lib/gameProfileSync'
import {
  getLoaderDisplayName,
  PROFILE_MOD_LOADER_IDS,
  PROFILE_MOD_LOADER_MAIN,
  PROFILE_SERVER_CORE_IDS,
  PROFILE_SERVER_CORE_MAIN,
} from '@/lib/loaders'
import { NEWS_BADGE_EVENT } from '../components/NewsCounter'
import { onSoundsMutedChange, playChime, playPoof, setSoundsMuted, soundsMuted } from '../components/softSounds'
import { isHalloweenSeason, onGhostTurboChange, readGhostTurbo, setGhostTurbo } from '@/lib/halloween'
import { isNewYearSeason, onSnowTurboChange, readSnowTurbo, setSnowTurbo } from '@/lib/newYear'
import { ClearFavoritesButton, ClearHistoryButton } from './FavoriteActions'
import { announceFestiveChange, onFestiveChange } from '@/lib/festive'

const PROFILE_PAYLOAD = { loader: 'gameLoader', gameVersion: 'gameVersion', serverCore: 'serverCore', serverVersion: 'serverVersion' }

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

export function SettingsCard({ title, hint, children }) {
  return (
    <section className="universal-card settings-section">
      <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
      {hint ? <p className="text-gray-400 mb-2 text-xs md:text-sm">{hint}</p> : null}
      <div className="divide-y divide-gray-800">{children}</div>
    </section>
  )
}

function ErrorLine({ error }) {
  return error ? (
    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400" role="alert">
      {error}
    </p>
  ) : null
}

function useAccountSave() {
  const t = useT()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  const save = async (key, payload, apply, revert) => {
    if (busy) return false
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

  return { busy, setBusy, error, setError, save }
}

export function GameSettings({ game }) {
  const t = useT()
  const { busy, error, save } = useAccountSave()
  const [profile, setProfile] = useState(game.chosen)
  const { release: gameVersions, full: allGameVersions } = useMinecraftVersions()
  const [ownServer, setOwnServer] = useState(Boolean(game.chosen.serverCore || game.chosen.serverVersion || game.guess.serverCore))

  const toggleOwnServer = () => {
    if (!ownServer) {
      setOwnServer(true)
      return
    }
    if (!profile.serverCore && !profile.serverVersion) {
      setOwnServer(false)
      return
    }
    const previous = { serverCore: profile.serverCore, serverVersion: profile.serverVersion }
    save(
      'ownServer',
      { serverCore: '', serverVersion: '' },
      () => {
        setOwnServer(false)
        setProfile((current) => ({ ...current, serverCore: '', serverVersion: '' }))
      },
      () => {
        setOwnServer(true)
        setProfile((current) => ({ ...current, ...previous }))
      },
    ).then((ok) => {
      if (!ok) return
      rememberProfileField('serverCore', '')
      rememberProfileField('serverVersion', '')
    })
  }

  return (
    <section className="universal-card settings-section">
      <h2 className="text-xl font-bold text-white mb-1">{t('set.gameTitle')}</h2>
      <p className="text-gray-400 text-xs md:text-sm">{t('set.gameHint')}</p>
      {[
        { title: t('set.modsTitle'), core: 'loader', version: 'gameVersion', coreLabel: t('set.loader'), versionLabel: t('set.gameVersion'), coreHelp: t('set.loaderHelp'), versionHelp: t('set.gameVersionHelp'), cores: PROFILE_MOD_LOADER_IDS, main: PROFILE_MOD_LOADER_MAIN },
        { title: t('set.pluginsTitle'), core: 'serverCore', version: 'serverVersion', coreLabel: t('set.serverCore'), versionLabel: t('set.serverVersion'), coreHelp: t('set.serverCoreHelp'), versionHelp: t('set.serverVersionHelp'), cores: PROFILE_SERVER_CORE_IDS, main: PROFILE_SERVER_CORE_MAIN, server: true },
      ].map((group) => (
        <div key={group.core} className="mt-5">
          {group.server ? (
            <div className="flex items-center justify-between gap-4 border-t border-gray-800 pt-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">{t('set.ownServer')}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{t('set.ownServerHint')}</p>
              </div>
              <Switch
                checked={ownServer}
                label={t('set.ownServer')}
                disabled={Boolean(busy)}
                onChange={toggleOwnServer}
              />
            </div>
          ) : (
            <div className="mb-2 text-sm font-semibold text-white">{group.title}</div>
          )}
          {group.server && !ownServer ? null : (
          <div className={`grid gap-3 sm:grid-cols-2 ${group.server ? 'mt-3' : ''}`}>
            {[
              {
                key: group.core,
                label: group.coreLabel,
                help: group.coreHelp,
                options: [
                  ...group.main.map((id) => ({ value: id, label: getLoaderDisplayName(id) })),
                  { section: t('set.moreOptions') },
                  ...group.cores
                    .filter((id) => !group.main.includes(id))
                    .map((id) => ({ value: id, label: getLoaderDisplayName(id) })),
                ],
                hint: game.guess[group.core] ? getLoaderDisplayName(game.guess[group.core]) : null,
              },
              {
                key: group.version,
                label: group.versionLabel,
                help: group.versionHelp,
                options: gameVersions.map((version) => ({ value: version, label: version })),
                allOptions: [
                  ...(profile[group.version] && !allGameVersions.includes(profile[group.version])
                    ? [{ value: profile[group.version], label: profile[group.version] }]
                    : []),
                  ...allGameVersions.map((version) => ({ value: version, label: version })),
                ],
                hint: game.guess[group.version] || null,
              },
            ].map((field) => (
              <GamePicker
                key={field.key}
                label={field.label}
                help={field.help}
                value={profile[field.key]}
                disabled={Boolean(busy)}
                searchPlaceholder={field.key === group.version ? t('set.versionSearch') : t('set.find')}
                emptyText={field.key === group.version ? t('set.versionNotFound') : t('set.nothingFound')}
                options={[{ value: '', label: t('set.auto'), hint: field.hint }, ...field.options]}
                allOptions={field.allOptions ? [{ value: '', label: t('set.auto'), hint: field.hint }, ...field.allOptions] : undefined}
                onChange={(next) =>
                  save(
                    field.key,
                    { [PROFILE_PAYLOAD[field.key]]: next },
                    () => setProfile((current) => ({ ...current, [field.key]: next })),
                    () => setProfile((current) => ({ ...current, [field.key]: profile[field.key] })),
                  ).then((ok) => ok && rememberProfileField(PROFILE_PAYLOAD[field.key], next))
                }
              />
            ))}
          </div>
          )}
        </div>
      ))}
      {Object.values(game.guess).some(Boolean) || Object.values(profile).some(Boolean) ? null : (
        <p className="mt-3 text-[11px] text-gray-600 dark:text-gray-500">{t('set.notGuessed')}</p>
      )}
      <ErrorLine error={error} />
    </section>
  )
}

export function NotificationSettings({ telegram, trackDownloads: initialTrack, mutedCount }) {
  const t = useT()
  const router = useRouter()
  const { busy, setBusy, error, setError, save } = useAccountSave()
  const [notify, setNotify] = useState(telegram.notify)
  const [trackDownloads, setTrackDownloads] = useState(initialTrack)

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
    <>
      {telegram.botId ? (
        <SettingsCard title="Telegram">
          <Setting title={t('tg.notifyTitle')} hint={t(telegram.linked ? 'tg.notifyHint' : 'tg.notifyNeedLink')}>
            {telegram.linked ? (
              <Switch
                checked={notify}
                label={t('tg.notifyTitle')}
                disabled={Boolean(busy)}
                onChange={() => save('notify', { telegram: !notify }, () => setNotify(!notify), () => setNotify(notify))}
              />
            ) : (
              <button type="button" onClick={linkTelegram} disabled={Boolean(busy)} className={LINK_BUTTON}>
                {t('account.telegramLink')}
              </button>
            )}
          </Setting>
        </SettingsCard>
      ) : null}

      <SettingsCard title={t('account.updates')}>
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
      </SettingsCard>
      <ErrorLine error={error} />
    </>
  )
}

export function ExtrasSettings({ newsBadge: initialNewsBadge, festive: initialFestive }) {
  const t = useT()
  const { busy, error, save } = useAccountSave()
  const [newsBadge, setNewsBadge] = useState(initialNewsBadge)
  const [festive, setFestive] = useState(initialFestive)
  const [kittenSounds, setKittenSounds] = useState(true)
  const [halloween, setHalloween] = useState(false)
  const [ghostTurbo, setGhostTurboState] = useState(false)
  const [newYear, setNewYear] = useState(false)
  const [snowTurbo, setSnowTurboState] = useState(false)

  useEffect(() => {
    setKittenSounds(!soundsMuted())
    return onSoundsMutedChange((muted) => setKittenSounds(!muted))
  }, [])

  useEffect(() => {
    setHalloween(isHalloweenSeason())
    setGhostTurboState(readGhostTurbo())
    return onGhostTurboChange(setGhostTurboState)
  }, [])

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

  return (
    <SettingsCard title={t('sn.extras')}>
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
      <ErrorLine error={error} />
    </SettingsCard>
  )
}

export function DataSettings({ recordHistory: initialRecord, counts }) {
  const t = useT()
  const { busy, error, save } = useAccountSave()
  const [recordHistory, setRecordHistory] = useState(initialRecord)

  return (
    <>
      <SettingsCard title={t('account.downloads')}>
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
        <ErrorLine error={error} />
      </SettingsCard>

      {counts.favorites > 0 || counts.downloads > 0 ? (
        <SettingsCard title={t('set.cleanupTitle')}>
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
        </SettingsCard>
      ) : null}
    </>
  )
}
