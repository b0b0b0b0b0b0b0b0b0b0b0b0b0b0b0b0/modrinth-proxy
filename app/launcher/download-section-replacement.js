'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import * as Popover from '@radix-ui/react-popover'
import { formatFileSize } from '@/lib/modrinth'
import { WindowsIcon, MacOSIcon, LinuxIcon, DownloadIcon, PirateIcon } from '../components/icons'
import { useT } from '../components/I18nProvider'
import { detectOS } from './DetectedOS'

const ASTRALRINTH_FALLBACK = {
  windows:
    'https://git.xorison.dev/didirus/AstralRinth/releases/download/AR-0.10.1601/AstralRinth%20App_0.10.1601_x64-setup.exe',
  macos:
    'https://git.xorison.dev/didirus/AstralRinth/releases/download/AR-0.10.1601/AstralRinth%20App_0.10.1601_aarch64.dmg',
  appimage:
    'https://git.xorison.dev/didirus/AstralRinth/releases/download/AR-0.10.1601/AstralRinth%20App_0.10.1601_amd64.AppImage',
  deb: 'https://git.xorison.dev/didirus/AstralRinth/releases/download/AR-0.10.1601/AstralRinth%20App_0.10.1601_amd64.deb',
  rpm: 'https://git.xorison.dev/didirus/AstralRinth/releases/download/AR-0.10.1601/AstralRinth%20App-0.10.1601-1.x86_64.rpm',
}

export const FLATHUB_URL = 'https://flathub.org/apps/com.modrinth.ModrinthApp'

const LINUX_FORMATS = [
  { id: 'flathub', label: 'Flathub' },
  { id: 'appimage', label: 'AppImage' },
  { id: 'deb', label: 'DEB' },
  { id: 'rpm', label: 'RPM' },
]

export function FlathubIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0.04 -1.13 62.99 60.24" aria-hidden>
      <g fill="currentColor" strokeWidth="1.123" transform="translate(-247.445 -135.95)scale(1.56993)">
        <circle cx="166.69" cy="95.647" r="9.048" />
        <rect width="15.875" height="15.875" x="158.75" y="108.33" rx="4.233" ry="4.233" />
        <path d="m195.534 93.49-1.622-.938-9.339-5.391a2.572 2.572 0 0 0-3.857 2.227v12.657a2.572 2.572 0 0 0 3.858 2.227l10.96-6.328a2.572 2.572 0 0 0 0-4.455zm-.544 22.82c0 .88-.708 1.587-1.587 1.587h-12.7c-.88 0-1.588-.708-1.588-1.587 0-.88.708-1.588 1.587-1.588h12.7c.88 0 1.588.709 1.588 1.588m-7.938-7.938c.88 0 1.588.709 1.588 1.588v12.7c0 .88-.708 1.587-1.587 1.587-.88 0-1.588-.708-1.588-1.587v-12.7c0-.88.708-1.587 1.587-1.587z" />
      </g>
    </svg>
  )
}

const DOWNLOAD_BUTTON_CLASS =
  'download-glass flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-modrinth-green font-bold text-black outline-none transition-transform duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-modrinth-green focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]'

function OsCard({ id, icon, title, subtitle, detected, url, buttonText, buttonIcon, extra, wide = false, first = false, note, children }) {
  return (
    <div
      className={`card-glass bg-modrinth-dark flex flex-col rounded-3xl p-6 transition-shadow duration-300 ${
        wide ? 'gap-5 md:col-span-2 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)_18rem] lg:items-center lg:gap-x-8 lg:gap-y-2' : ''
      } ${first ? 'order-first' : ''} ${detected ? 'ring-1 ring-modrinth-green/40' : ''}`}
    >
      <div className={`flex items-center gap-4 ${wide ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
        <span className="inline-flex shrink-0">{icon}</span>
        <div className="min-w-0">
          <h3 className="m-0 text-xl font-bold text-white"><span id={id}>{title}</span></h3>
          <p className="m-0 mt-0.5 text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>

      {children ? <div className="min-w-0 lg:col-start-2 lg:row-start-1">{children}</div> : null}
      {note ? <div className="-mt-2 min-w-0 lg:col-start-2 lg:row-start-2 lg:mt-0">{note}</div> : null}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${DOWNLOAD_BUTTON_CLASS} ${wide ? 'lg:col-start-3 lg:row-start-1' : 'mt-6'}`}
      >
        {buttonIcon || <DownloadIcon />}
        <span className="truncate">{buttonText}</span>
      </a>
      {extra ? (
        <div className={`flex justify-center ${wide ? '-mt-3 lg:col-start-3 lg:row-start-2 lg:mt-0' : 'mt-2'}`}>{extra}</div>
      ) : null}
    </div>
  )
}

const OS_NAMES = { windows: 'Windows', macos: 'macOS', linux: 'Linux' }

const KIND_LABELS = { exe: 'EXE', msi: 'MSI', dmg: 'DMG', appimage: 'AppImage', deb: 'DEB', rpm: 'RPM' }

function archLabel(platform, arch) {
  if (platform === 'macos') return arch === 'arm64' ? 'Apple Silicon' : 'Intel'
  return arch === 'arm64' ? 'ARM64' : 'x64'
}

function AstralFilesMenu({ files, version, platform }) {
  const t = useT()
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-gray-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-modrinth-green data-[state=open]:text-white"
        >
          {t('app.astralFiles', { os: OS_NAMES[platform] })}
          <svg className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          sideOffset={8}
          collisionPadding={12}
          className="glass-pop z-50 w-72 max-w-[calc(100vw-24px)] rounded-2xl p-2"
        >
          <div className="flex items-center justify-between px-2 pb-2 pt-1 text-xs font-semibold text-gray-500">
            <span>{t('app.astralFiles', { os: OS_NAMES[platform] })}</span>
            {version ? <span className="font-mono">{version}</span> : null}
          </div>
          <div className="flex flex-col gap-0.5">
            {files.map((file) => (
              <a
                key={file.url}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm outline-none transition-colors hover:bg-white/5 focus-visible:bg-white/5"
              >
                <DownloadIcon className="h-4 w-4 shrink-0 text-gray-500 transition-colors group-hover:text-modrinth-green" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span className="font-semibold text-white">{KIND_LABELS[file.kind] || file.kind}</span>
                    <span className="text-gray-400">{archLabel(platform, file.arch)}</span>
                    {file.experimental ? (
                      <span className="rounded-full bg-orange-400/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-orange-400">
                        {t('app.experimental')}
                      </span>
                    ) : null}
                  </span>
                </span>
                {file.size ? <span className="shrink-0 text-xs tabular-nums text-gray-500">{formatFileSize(file.size)}</span> : null}
              </a>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function SegmentedSwitch({ options, value, onChange, layoutId, accent = false, className = '' }) {
  const reduceMotion = useReducedMotion()
  return (
    <div className={`glass-track relative flex rounded-full bg-[var(--bg-primary)] p-1 text-sm font-bold ${className}`} role="radiogroup">
      {options.map((option) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={`relative z-[1] flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-modrinth-green ${
              selected ? (accent ? 'text-black' : 'text-white') : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {selected ? (
              <motion.span
                layoutId={layoutId}
                className={`glass-pill absolute inset-0 -z-[1] rounded-full ${accent ? 'bg-modrinth-green' : 'bg-[var(--bg-tertiary)]'}`}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
              />
            ) : null}
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export const EDITION_EVENT = 'launcher-edition'

export const DownloadSection = ({ launcherData, astralData }) => {
  const t = useT()
  const [os, setOs] = useState(null)
  const [edition, setEdition] = useState('modrinth')
  const [linuxFormat, setLinuxFormat] = useState('flathub')

  useEffect(() => {
    setOs(detectOS())
    if (window.location.hash === '#astralrinth') setEdition('astral')
    const onEdition = (event) => setEdition(event.detail === 'astral' ? 'astral' : 'modrinth')
    window.addEventListener(EDITION_EVENT, onEdition)
    return () => window.removeEventListener(EDITION_EVENT, onEdition)
  }, [])

  const astral = astralData?.downloads
  const astralUrls = {
    windows: astral?.windows || ASTRALRINTH_FALLBACK.windows,
    macos: astral?.macos || ASTRALRINTH_FALLBACK.macos,
    appimage: astral?.linux?.appimage || ASTRALRINTH_FALLBACK.appimage,
    deb: astral?.linux?.deb || ASTRALRINTH_FALLBACK.deb,
    rpm: astral?.linux?.rpm || ASTRALRINTH_FALLBACK.rpm,
  }

  if (!launcherData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{t('app.versionsFail')}</p>
      </div>
    )
  }

  const isAstral = edition === 'astral'
  const formats = isAstral ? LINUX_FORMATS.filter((f) => f.id !== 'flathub') : LINUX_FORMATS
  const format = isAstral && linuxFormat === 'flathub' ? 'appimage' : linuxFormat
  const formatLabel = LINUX_FORMATS.find((f) => f.id === format)?.label
  const isFlathub = format === 'flathub'
  const skull = <PirateIcon className="h-5 w-5 -translate-y-[1.5px]" />

  const filesMenu = (platform) =>
    isAstral && astralData?.files?.[platform]?.length > 1 ? (
      <AstralFilesMenu files={astralData.files[platform]} version={astralData.version} platform={platform} />
    ) : null

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <SegmentedSwitch
          layoutId="launcher-edition"
          accent
          className="w-full"
          value={edition}
          onChange={setEdition}
          options={[
            { id: 'modrinth', label: 'Modrinth App' },
            { id: 'astral', label: 'AstralRinth', icon: <PirateIcon className="h-4 w-4 -translate-y-px" /> },
          ]}
        />
        {isAstral ? (
          <p className="m-0 text-center text-sm text-gray-400">{t('app.astralTip')}</p>
        ) : (
          <button
            type="button"
            onClick={() => setEdition('astral')}
            className="rounded-lg px-2 py-0.5 text-center text-sm text-gray-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-modrinth-green"
          >
            {t('app.noLicense')}{' '}
            <span className="font-semibold text-modrinth-green">AstralRinth</span>{' '}
            {t('app.withOffline')}
          </button>
        )}
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <OsCard
          id="download-os-windows"
          icon={<WindowsIcon className="h-12 w-12" />}
          title="Windows"
          subtitle={t('app.winInstaller')}
          detected={os === 'Windows'}
          url={isAstral ? astralUrls.windows : launcherData.downloads.windows}
          buttonText={t('app.dlWin')}
          buttonIcon={isAstral ? skull : null}
          extra={filesMenu('windows')}
        />

        <OsCard
          id="download-os-macos"
          icon={<MacOSIcon className="h-12 w-12 text-gray-300" />}
          title="macOS"
          subtitle={t('app.macDmg')}
          detected={os === 'macOS'}
          url={isAstral ? astralUrls.macos : launcherData.downloads.macos}
          buttonText={t('app.dlMac')}
          buttonIcon={isAstral ? skull : null}
          extra={filesMenu('macos')}
        />

        <OsCard
          id="download-os-linux"
          icon={<LinuxIcon className="h-12 w-12 text-orange-400 dark-icon" />}
          title="Linux"
          subtitle={formats.map((f) => f.label).join(' · ')}
          detected={os === 'Linux'}
          url={isAstral ? astralUrls[format] : isFlathub ? FLATHUB_URL : launcherData.downloads.linux[format]}
          buttonText={isFlathub ? t('app.dlFlathub') : t('project.downloadNamed', { title: formatLabel })}
          buttonIcon={isAstral ? skull : isFlathub ? <FlathubIcon /> : null}
          extra={filesMenu('linux')}
          wide
          first={os === 'Linux'}
          note={
            !isAstral && !isFlathub ? (
              <p className="m-0 flex items-center justify-center gap-1.5 text-xs font-medium text-orange-400/90">
                <svg className="h-3.5 w-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0M12 9v4M12 17h.01" />
                </svg>
                {t('app.advancedOnly')}
              </p>
            ) : null
          }
        >
          <SegmentedSwitch layoutId="linux-format" className="w-full" options={formats} value={format} onChange={setLinuxFormat} />
        </OsCard>
      </div>
    </div>
  )
}
