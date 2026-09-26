'use client'

import { useState } from 'react'
import Link from 'next/link'
import StyledTooltip from './StyledTooltip'

import { SERVER_REGIONS } from '@/lib/serverCategories'
import { compressSidebarGameVersions, formatServerSidebarVersions } from '@/lib/minecraftVersionSort'
import CompressedGameVersionsChips from './CompressedGameVersionsChips'
import CopyButton from './CopyButton'
import { useI18n } from './I18nProvider'
import { formatRelative } from './RelativeTime'
import { intlLocale } from '@/lib/i18n/config'
import { languageDisplayName, pluralCount, serverRegionLabel } from '@/lib/i18n/label'

function mapRegion(t, region) {
  if (!region) return null
  const id = region.toLowerCase()
  const aliased = id === 'eu' ? 'europe' : id === 'ru' ? 'russia' : id
  const reg = SERVER_REGIONS.find((r) => r.id.toLowerCase() === aliased)
  return serverRegionLabel(t, aliased, reg?.name || region.toUpperCase())
}

function ServerAddressCopy({ address, tooltip, variant = 'prominent', ourIpLabel, copiedLabel }) {
  const [copied, setCopied] = useState(false)
  const subtle = variant === 'subtle'

  const handleCopy = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyIconClass = copied
    ? 'h-3.5 w-3.5 shrink-0 text-modrinth-green'
    : 'h-3.5 w-3.5 shrink-0 text-gray-500 opacity-50 transition-opacity duration-150 group-hover:opacity-80'

  return (
    <StyledTooltip label={copied ? copiedLabel : tooltip}>
      <button
        type="button"
        onClick={handleCopy}
        className="group flex w-full min-w-0 items-center gap-2 py-0.5 text-left outline-none"
      >
        {!subtle && (
          <span className="shrink-0 text-xs font-medium text-gray-500">{ourIpLabel}</span>
        )}
        <span
          className={`min-w-0 flex-1 truncate leading-tight transition-colors duration-150 ${
            subtle
              ? `text-sm font-mono ${copied ? 'text-modrinth-green' : 'text-gray-400 group-hover:text-gray-300'}`
              : `text-base font-bold ${copied ? 'text-modrinth-green' : 'text-white group-hover:text-modrinth-green/90'}`
          }`}
        >
          {address}
        </span>
        {copied ? (
          <svg
            className={copyIconClass}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg
            className={copyIconClass}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
        )}
      </button>
    </StyledTooltip>
  )
}

export default function ServerSidebarDetails({ server, requiredContentVersion = null }) {
  const { t, locale } = useI18n()
  const javaAddress = server.minecraft_java_server?.address?.trim() || ''
  const bedrockAddress = server.minecraft_bedrock_server?.address?.trim() || ''

  const primaryFile = requiredContentVersion?.files?.find(f => f.primary) || requiredContentVersion?.files?.[0]
  const downloadUrl = primaryFile?.url

  const javaContent = server.minecraft_java_server?.content
  const gameVersions = javaContent?.supported_game_versions || server.game_versions || []
  const recommendedVersion = javaContent?.recommended_game_version || null
  const loaders = server.loaders || server.mrpack_loaders || []

  const projectId = server.id ?? server.project_id
  const versionId = requiredContentVersion?.id ?? server.minecraft_java_server?.content?.version_id ?? server.versions?.[0]
  const followers = server.followers ?? server.follows ?? 0

  const pingData = server.minecraft_java_server?.ping?.data
  const latencyNanos = pingData?.latency?.nanos
  const latencyMs = latencyNanos ? Math.round(latencyNanos / 1000000) : null

  const versionItems = formatServerSidebarVersions(gameVersions, recommendedVersion)
  const versionRanges = versionItems
    .filter((item) => item.kind === 'range')
    .map((item) => item.range)
  const displayRanges =
    versionRanges.length > 0 ? versionRanges : compressSidebarGameVersions(gameVersions)

  const regionName = server.minecraft_server?.region
    ? mapRegion(t, server.minecraft_server.region)
    : null

  return (
    <div className="bg-modrinth-dark border border-gray-800 rounded-2xl p-4 flex flex-col gap-4 shadow-lg">
      <h2 className="text-lg font-bold text-white m-0">{t('project.aboutServer')}</h2>

      {(javaAddress || gameVersions.length > 0 || loaders.length > 0) && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-bold m-0 mb-2 text-[var(--text-gray)]">
              {javaAddress && bedrockAddress && javaAddress === bedrockAddress
                ? t('server.javaAndBedrock')
                : t('server.javaEdition')}
            </h3>
            {javaAddress && (
              <div className="mb-3 pb-3 border-b border-gray-800/70">
                <ServerAddressCopy 
                  address={javaAddress} 
                  tooltip={javaAddress === bedrockAddress ? t('server.copyServer') : t('server.copyJava')}
                  ourIpLabel={t('server.ourIp')}
                  copiedLabel={t('copy.copied')}
                />
                <button
                  type="button"
                  onClick={() => window.open(`https://ping.modrinth.black/?s=${encodeURIComponent(javaAddress)}`, '_blank', 'noopener,noreferrer')}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-modrinth-green/25 bg-modrinth-green/8 px-3 py-2 text-sm font-semibold text-modrinth-green transition-all hover:border-modrinth-green/50 hover:bg-modrinth-green/15 active:scale-[0.97]"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                    <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" />
                  </svg>
                  {t('server.ping')}
                </button>
              </div>
            )}
            {server.minecraft_java_server?.content && server.minecraft_java_server.content.kind !== 'vanilla' && (server.minecraft_java_server.content.project_name || server.minecraft_java_server.content.version_id) && (
              <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-gray-800/70">
                <StyledTooltip label={t('server.requiredPackTip')}>
                  <h3 className="text-base font-bold m-0 text-[var(--text-gray)] cursor-help hover:text-white transition-colors w-fit">
                    {t('server.requiredPack')}
                  </h3>
                </StyledTooltip>
                <div className="flex gap-1.5 items-center justify-between px-3 pr-1.5 py-1.5 rounded-xl bg-gray-900/50 border border-gray-800/40">
                  <div className="flex gap-2 items-center min-w-0">
                    {server.minecraft_java_server.content.project_icon && (
                      <img
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                        src={server.minecraft_java_server.content.project_icon}
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-semibold text-sm text-white leading-tight">
                        {server.minecraft_java_server.content.project_name}
                      </span>
                      {(requiredContentVersion?.version_number || server.minecraft_java_server.content.version_id) && (
                        <span className="truncate text-xs text-gray-400 font-medium">
                          {requiredContentVersion?.version_number || t('server.versionPrefix', { id: server.minecraft_java_server.content.version_id })}
                        </span>
                      )}
                    </div>
                  </div>
                  {downloadUrl && (
                    <StyledTooltip label={t('server.downloadPack')}>
                      <a 
                        href={downloadUrl}
                        className="w-8 h-8 rounded-full bg-modrinth-green/10 hover:bg-modrinth-green/20 text-modrinth-green flex items-center justify-center transition-all active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
                        </svg>
                      </a>
                    </StyledTooltip>
                  )}
                </div>
              </div>
            )}
            {(displayRanges.length > 0 || recommendedVersion) && (
              <div className="pt-0.5">
                <h3 className="text-base font-bold m-0 mb-2.5 text-[var(--text-gray)]">
                  {t('server.joinVersions')}
                </h3>
                <CompressedGameVersionsChips
                  browseRoute="discover/servers"
                  rawVersions={gameVersions}
                  ranges={displayRanges}
                  versionSearchParam="sgv"
                  recommendedVersion={recommendedVersion}
                  maxVisible={12}
                />
              </div>
            )}
          </div>
          {loaders.length > 0 && (
            <div>
              <h3 className="text-base font-bold m-0 mb-2 text-[var(--text-gray)]">{t('project.platforms')}</h3>
              <div className="flex flex-wrap gap-1">
                {loaders.map((loader) => (
                  <Link
                    key={String(loader)}
                    href={`/discover/servers?sc=${encodeURIComponent(String(loader).toLowerCase())}`}
                    className="z-[1] inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-2 py-1 text-sm font-normal leading-none text-[var(--text-muted)] transition-transform hover:underline active:scale-[0.95] outline-none capitalize"
                  >
                    {loader}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {bedrockAddress && javaAddress !== bedrockAddress && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-bold m-0 text-[var(--text-gray)]">
            {t('server.bedrockEdition')}
          </h3>
          <ServerAddressCopy
            address={bedrockAddress}
            variant="subtle"
            tooltip={t('server.copyBedrock')}
            copiedLabel={t('copy.copied')}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-base font-bold m-0 text-[var(--text-gray)]">{t('server.location')}</h3>
        <div className="flex flex-wrap gap-1.5 items-center">
          {server.minecraft_java_server?.ping?.data ? (
            <>
              <StyledTooltip label={t('server.onlineTip')}>
                <span className="bg-green-500/10 border border-green-500/30 px-2.5 py-1.5 leading-none rounded-full text-xs font-bold text-green-400 flex items-center gap-1 cursor-help">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" />
                  </svg>
                  {t('server.onlineBadge')}
                </span>
              </StyledTooltip>
              {latencyMs != null && (
                <StyledTooltip label={t('server.latencyTip', { n: latencyMs })}>
                  <span className="bg-gray-800/60 border border-gray-700/40 px-2.5 py-1.5 leading-none rounded-full text-xs font-semibold text-gray-300 flex items-center gap-1 cursor-help hover:text-white transition-colors">
                    <svg className="w-5 h-5 text-modrinth-green shrink-0 relative -translate-y-[2px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M12 20h.01M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 14 0" />
                    </svg>
                    <span>{t('server.latency', { n: latencyMs })}</span>
                  </span>
                </StyledTooltip>
              )}
            </>
          ) : (
            <span className="bg-gray-800/60 border border-gray-700/40 px-2.5 py-1.5 leading-none rounded-full text-xs font-semibold text-gray-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5M5 12.5a10.94 10.94 0 0 1 5.83-2.84" />
                <path d="M8.9 5.1a16.84 16.84 0 0 1 12.2 4.4M2.9 8.9a16.85 16.85 0 0 1 2.2-1.3" />
              </svg>
              {t('server.offline')}
            </span>
          )}
          {regionName && (
            <StyledTooltip label={t('server.locationNamed', { name: regionName })}>
              <span className="bg-gray-800/60 border border-gray-700/40 px-2.5 py-1.5 leading-none rounded-full text-xs font-semibold text-gray-300 cursor-default">
                {regionName}
              </span>
            </StyledTooltip>
          )}
        </div>
      </div>

      {server.minecraft_server?.languages && server.minecraft_server.languages.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-bold m-0 text-[var(--text-gray)]">{t('server.languages')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {server.minecraft_server.languages.map(lang => (
              <span key={lang} className="bg-gray-800/60 border border-gray-700/40 px-2.5 py-1.5 leading-none rounded-full text-xs font-semibold text-gray-300">
                {languageDisplayName(locale, lang)}
              </span>
            ))}
          </div>
        </div>
      )}
      {(projectId || versionId) && (
        <div className="flex flex-col gap-2 pt-3 border-t border-gray-800/50">
          <h3 className="text-base font-bold m-0 text-[var(--text-gray)]">{t('project.details')}</h3>
          <div className="space-y-2 text-xs md:text-sm">
            {followers > 0 && (
              <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                <span className="font-semibold text-[var(--text-gray)]">{t('server.followers')}</span>
                <span className="font-semibold text-white">{formatFollowers(followers, locale, t)}</span>
              </div>
            )}
            {server.published && (
              <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                <span className="font-semibold text-[var(--text-gray)]">{t('version.published')}</span>
                <span className="font-semibold text-white">{formatRelative(server.published, t) || '—'}</span>
              </div>
            )}
            {projectId && (
              <div className="flex justify-between items-center border-b border-gray-800/40 pb-1.5">
                <span className="font-semibold text-[var(--text-gray)]">{t('server.projectId')}</span>
                <CopyButton text={projectId} inline />
              </div>
            )}
            {versionId && (
              <div className="flex justify-between items-center border-b border-gray-800/40 pb-1.5">
                <span className="font-semibold text-[var(--text-gray)]">{t('server.versionId')}</span>
                <CopyButton text={versionId} inline />
              </div>
            )}
          </div>
        </div>
      )}
      {pingData?.version_name && (
        <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-850/80">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{t('project.core')}</span>
          <StyledTooltip label={t('server.coreTip')}>
            <span className="text-xs font-semibold text-gray-400 cursor-help w-fit">{pingData.version_name}</span>
          </StyledTooltip>
        </div>
      )}
    </div>
  )
}

function formatFollowers(count, locale, t) {
  const word = pluralCount(
    locale,
    count,
    t('server.followerOne'),
    t('server.followerFew'),
    t('server.followerMany'),
  )
  return `${count.toLocaleString(intlLocale(locale))} ${word}`
}
