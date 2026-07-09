'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { compareMinecraftVersionsDesc } from '@/lib/minecraftVersionSort'
import {
  filterVersionsForProject,
  getVersionGameVersions,
  getVersionLoaders,
  normalizeContentRoute,
} from '@/lib/contextualVersions'
import { resolveAlternateProjectFormat } from '@/lib/alternateProjectFormat'
import { resolveModrinthProjectAccent } from '@/lib/modrinth'
import { downloadZipBundle, downloadFilesSequentially, buildModrinthExtractZipName } from '@/lib/downloadZip'
import StyledTooltip from './StyledTooltip'
import { favoritesManager } from '@/lib/favoritesManager'
import DownloadVersionDependencies from './DownloadVersionDependencies'
import { DownloadFooterButton } from './DownloadModalParts'
import DownloadModalPickers from './DownloadModalPickers'
import DownloadCompatibleVersions from './DownloadCompatibleVersions'
import DownloadVersionBundledFiles from './DownloadVersionBundledFiles'
import Lottie from 'lottie-react'
import bookmarkAnimation from '@/public/animations/bookmark.json'
import noBookmarkAnimation from '@/public/animations/no_bookmark.json'

function LottieStar({ isFavorite, animationData, onClick, label, alwaysVisible = false }) {
  const lottieRef = useRef(null)
  const justClickedRef = useRef(false)

  const updateFrame = () => {
    const player = lottieRef.current
    if (!player) return

    if (isFavorite) {
      if (justClickedRef.current) {
        player.goToAndPlay(0, true)
      } else {
        player.goToAndStop(player.getDuration(true) - 1, true)
      }
    } else {
      player.goToAndStop(0, true)
    }
    justClickedRef.current = false
  }

  useEffect(() => {
    updateFrame()
  }, [isFavorite])

  const handleDOMLoaded = () => {
    updateFrame()
  }

  const handleClick = (e) => {
    justClickedRef.current = true
    if (onClick) onClick(e)
  }

  const handleMouseEnter = () => {
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(0, true)
    }
  }

  const handleMouseLeave = () => {
    const player = lottieRef.current
    if (!player) return
    if (isFavorite) {
      player.goToAndStop(player.getDuration(true) - 1, true)
    } else {
      player.goToAndStop(0, true)
    }
  }

  if (!animationData) {
    return (
      <StyledTooltip label={label}>
        <button
          type="button"
          onClick={onClick}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isFavorite || alwaysVisible
              ? 'text-modrinth-green scale-110'
              : 'text-gray-500 hover:text-modrinth-green hover:scale-110 opacity-0 group-hover/row:opacity-100 focus:opacity-100'
          }`}
        >
          <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      </StyledTooltip>
    )
  }

  return (
    <StyledTooltip label={label}>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`p-1 rounded-lg transition-all duration-200 hover:scale-110 flex items-center justify-center w-8 h-8 ${
          isFavorite || alwaysVisible
            ? ''
            : 'opacity-0 group-hover/row:opacity-100 focus:opacity-100'
        }`}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={false}
          autoplay={false}
          onDOMLoaded={handleDOMLoaded}
          onDataReady={handleDOMLoaded}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      </button>
    </StyledTooltip>
  )
}

const VERSION_TYPE_ORDER = { release: 0, beta: 1, alpha: 2 }

function pickCompatibleVersionsByChannel(versions) {
  const byChannel = new Map()

  for (const version of versions) {
    const channel = String(version.version_type || 'release').toLowerCase()
    const current = byChannel.get(channel)
    if (!current) {
      byChannel.set(channel, version)
      continue
    }
    const currentDate = new Date(current.date_published || 0).getTime()
    const nextDate = new Date(version.date_published || 0).getTime()
    if (nextDate > currentDate) {
      byChannel.set(channel, version)
    }
  }

  return [...byChannel.entries()]
    .sort(([channelA], [channelB]) => {
      const typeA = VERSION_TYPE_ORDER[channelA] ?? 3
      const typeB = VERSION_TYPE_ORDER[channelB] ?? 3
      return typeA - typeB
    })
    .map(([, version]) => version)
}

export default function DownloadModal({ mod, versions, contentType = 'mods' }) {
  const router = useRouter()
  const accent = useMemo(() => resolveModrinthProjectAccent(mod?.color), [mod?.color])
  const downloadBtnAccentStyle = accent
    ? { backgroundColor: accent.accentHex, color: accent.activeFgHex }
    : undefined
  const [isOpen, setIsOpen] = useState(false)
  const [portalTarget, setPortalTarget] = useState(null)

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true)
    }
    window.addEventListener('open-download-modal', handleOpenModal)
    return () => {
      window.removeEventListener('open-download-modal', handleOpenModal)
    }
  }, [])

  const [selectedMcVersion, setSelectedMcVersion] = useState('')
  const [selectedLoader, setSelectedLoader] = useState('')
  const [versionSearch, setVersionSearch] = useState('')
  const [showAllVersions, setShowAllVersions] = useState(false)
  const [favMcVersion, setFavMcVersion] = useState('')
  const [favLoader, setFavLoader] = useState('')
  const [showLauncherHelp, setShowLauncherHelp] = useState(false)
  const [depItems, setDepItems] = useState([])
  const [zipLoading, setZipLoading] = useState(false)
  const [depsZipLoading, setDepsZipLoading] = useState(false)
  const [openPicker, setOpenPicker] = useState(null)
  const [selectedCompatibleVersionId, setSelectedCompatibleVersionId] = useState('')

  const contentRoute = normalizeContentRoute(contentType)

  const contextualVersions = useMemo(
    () => filterVersionsForProject(versions, mod, contentType),
    [versions, mod, contentType],
  )

  const launcherUri = useMemo(() => {
    const isModpack = contentType === 'modpack' || contentType === 'modpacks'
    const type = isModpack ? 'modpack' : 'mod'
    return `modrinth://${type}/${mod?.slug}`
  }, [contentType, mod?.slug])

  const showAppSection = contentRoute === 'mod' || contentRoute === 'modpack'

  const alternateDownloadFormat = useMemo(
    () =>
      resolveAlternateProjectFormat({
        project: mod,
        contentType,
        versions,
      }),
    [mod, versions, contentType],
  )

  const handleInstallClick = () => {
    window.location.href = launcherUri
    setTimeout(() => {
      setShowLauncherHelp(true)
    }, 1500)
  }


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleHashChange = () => {
        if (window.location.hash === '#download') {
          setIsOpen(true)
        }
      }
      handleHashChange()
      window.addEventListener('hashchange', handleHashChange)
      return () => {
        window.removeEventListener('hashchange', handleHashChange)
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      wasOpenedRef.current = true
      setShowLauncherHelp(false)
      const activeFavVersion = favoritesManager.getFavoriteMcVersion(contentType)
      const activeFavLoader = favoritesManager.getFavoriteLoader(contentType)
      setFavMcVersion(activeFavVersion)
      setFavLoader(activeFavLoader)

      const searchParams = new URLSearchParams(window.location.search)
      const urlVersion = searchParams.get('version')
      const urlLoader = searchParams.get('loader')

      const availableMcVersions = new Set()
      contextualVersions.forEach(version => {
        getVersionGameVersions(version).forEach(v => availableMcVersions.add(v))
      })

      let targetVersion = ''
      let targetLoader = ''

      if (urlVersion && availableMcVersions.has(urlVersion)) {
        targetVersion = urlVersion
        const availableLoaders = new Set()
        contextualVersions.forEach(version => {
          if (getVersionGameVersions(version).includes(urlVersion)) {
            getVersionLoaders(version).forEach(l => availableLoaders.add(l))
          }
        })
        if (urlLoader && availableLoaders.has(urlLoader)) {
          targetLoader = urlLoader
        } else if (availableLoaders.size === 1) {
          targetLoader = Array.from(availableLoaders)[0]
        }
      } else if (activeFavVersion && availableMcVersions.has(activeFavVersion)) {
        targetVersion = activeFavVersion
        const availableLoaders = new Set()
        contextualVersions.forEach(version => {
          if (getVersionGameVersions(version).includes(activeFavVersion)) {
            getVersionLoaders(version).forEach(l => availableLoaders.add(l))
          }
        })
        if (activeFavLoader && availableLoaders.has(activeFavLoader)) {
          targetLoader = activeFavLoader
        } else if (availableLoaders.size === 1) {
          targetLoader = Array.from(availableLoaders)[0]
        }
      }

      setSelectedMcVersion(targetVersion)
      setSelectedLoader(targetLoader)
      isInitialUrlSyncRef.current = true
    } else {
      isInitialUrlSyncRef.current = false
      setOpenPicker(null)
    }
  }, [isOpen, contextualVersions, contentType])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!wasOpenedRef.current) {
        return
      }
      if (isOpen && !isInitialUrlSyncRef.current) {
        return
      }
      const url = new URL(window.location.href)
      if (isOpen) {
        url.hash = 'download'
        if (selectedMcVersion) {
          url.searchParams.set('version', selectedMcVersion)
        } else {
          url.searchParams.delete('version')
        }
        if (selectedLoader) {
          url.searchParams.set('loader', selectedLoader)
        } else {
          url.searchParams.delete('loader')
        }
      } else {
        url.hash = ''
        url.searchParams.delete('version')
        url.searchParams.delete('loader')
      }
      const newUrl = url.toString().replace(/#$/, '')
      if (window.location.href !== newUrl) {
        window.history.replaceState(null, '', newUrl)
      }
    }
  }, [isOpen, selectedMcVersion, selectedLoader])

  const originalTitleRef = useRef('')
  const isInitialUrlSyncRef = useRef(false)
  const wasOpenedRef = useRef(false)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      originalTitleRef.current = document.title
    }
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isOpen) {
        let typeName = 'Ресурс'
        if (contentType === 'plugin' || contentType === 'plugins') typeName = 'Плагин'
        else if (contentType === 'datapack' || contentType === 'datapacks') typeName = 'Датапак'
        else if (contentType === 'resourcepack' || contentType === 'resourcepacks') typeName = 'Ресурспак'
        else if (contentType === 'shader' || contentType === 'shaders') typeName = 'Шейдер'
        else if (contentType === 'modpack' || contentType === 'modpacks') typeName = 'Модпак'
        else if (contentType === 'mod' || contentType === 'mods') typeName = 'Мод'

        let newTitle = `Скачать ${mod?.title || ''} — Майнкрафт ${typeName}`
        if (selectedMcVersion) {
          newTitle += ` на Minecraft ${selectedMcVersion}`
        }
        if (selectedLoader) {
          const names = {
            'fabric': 'Fabric',
            'forge': 'Forge',
            'neoforge': 'NeoForge',
            'quilt': 'Quilt',
            'bukkit': 'Bukkit',
            'paper': 'Paper',
            'spigot': 'Spigot',
            'purpur': 'Purpur',
            'folia': 'Folia',
            'sponge': 'Sponge',
            'bungeecord': 'BungeeCord',
            'velocity': 'Velocity',
            'waterfall': 'Waterfall'
          }
          const loaderName = names[selectedLoader] || selectedLoader
          newTitle += ` (${loaderName})`
        }

        document.title = newTitle
      } else {
        if (originalTitleRef.current) {
          document.title = originalTitleRef.current
        }
      }
    }
  }, [isOpen, selectedMcVersion, selectedLoader, mod?.title, contentType])

  const selectMcVersion = (version) => {
    if (!version) {
      setSelectedMcVersion('')
      return
    }
    setSelectedMcVersion(version)
    const availableLoaders = new Set()
    contextualVersions.forEach((v) => {
      if (getVersionGameVersions(v).includes(version)) {
        getVersionLoaders(v).forEach((l) => availableLoaders.add(l))
      }
    })
    if (selectedLoader && availableLoaders.has(selectedLoader)) {
      return
    }
    const activeFavLoader = favoritesManager.getFavoriteLoader(contentType)
    if (activeFavLoader && availableLoaders.has(activeFavLoader)) {
      setSelectedLoader(activeFavLoader)
    } else if (availableLoaders.size === 1) {
      setSelectedLoader(Array.from(availableLoaders)[0])
    } else {
      setSelectedLoader('')
    }
  }

  const selectLoader = (loader) => {
    if (!loader) {
      setSelectedLoader('')
      return
    }
    setSelectedLoader(loader)
    if (!selectedMcVersion) return

    const availableVersions = new Set()
    contextualVersions.forEach((v) => {
      if (getVersionLoaders(v).includes(loader)) {
        getVersionGameVersions(v).forEach((gv) => availableVersions.add(gv))
      }
    })
    if (!availableVersions.has(selectedMcVersion)) {
      setSelectedMcVersion('')
    }
  }

  const toggleFavoriteMcVersion = (version) => {
    const current = favoritesManager.getFavoriteMcVersion(contentType)
    const newValue = current === version ? '' : version
    favoritesManager.setFavoriteMcVersion(newValue, contentType)
    setFavMcVersion(newValue)
    if (newValue === version) {
      selectMcVersion(version)
    } else {
      setSelectedMcVersion('')
      setSelectedLoader('')
    }
  }

  const toggleFavoriteLoader = (loader) => {
    const current = favoritesManager.getFavoriteLoader(contentType)
    const newValue = current === loader ? '' : loader
    favoritesManager.setFavoriteLoader(newValue, contentType)
    setFavLoader(newValue)
    if (newValue === loader) {
      selectLoader(loader)
    } else {
      setSelectedLoader('')
    }
  }

  const isReleaseVersion = (version) => {
    if (!/^\d+\.\d+(\.\d+)?$/.test(version)) return false
    return !/-(pre|rc|snapshot)/i.test(version)
  }

  const allMcVersionsForPicker = useMemo(() => {
    const versionsSet = new Set()
    contextualVersions.forEach((version) => {
      if (selectedLoader && !getVersionLoaders(version).includes(selectedLoader)) {
        return
      }
      getVersionGameVersions(version).forEach((v) => versionsSet.add(v))
    })
    return Array.from(versionsSet).sort(compareMinecraftVersionsDesc)
  }, [contextualVersions, selectedLoader])

  const hasSnapshotVersions = useMemo(
    () => allMcVersionsForPicker.some((version) => !isReleaseVersion(version)),
    [allMcVersionsForPicker],
  )

  useEffect(() => {
    if (!hasSnapshotVersions) {
      setShowAllVersions(false)
    }
  }, [hasSnapshotVersions, selectedLoader])

  const mcVersions = useMemo(() => {
    if (showAllVersions) {
      return allMcVersionsForPicker
    }
    return allMcVersionsForPicker.filter((v) => isReleaseVersion(v))
  }, [allMcVersionsForPicker, showAllVersions])

  const allLoaders = useMemo(() => {
    const loadersSet = new Set()
    contextualVersions.forEach((version) => {
      getVersionLoaders(version).forEach((l) => loadersSet.add(l))
    })
    return Array.from(loadersSet)
  }, [contextualVersions])

  const loaders = useMemo(() => {
    if (!selectedMcVersion) return allLoaders
    const loadersSet = new Set()
    contextualVersions.forEach((version) => {
      if (getVersionGameVersions(version).includes(selectedMcVersion)) {
        getVersionLoaders(version).forEach((l) => loadersSet.add(l))
      }
    })
    return Array.from(loadersSet)
  }, [contextualVersions, selectedMcVersion, allLoaders])

  const filteredMcVersions = useMemo(() => {
    if (!versionSearch) return mcVersions
    return mcVersions.filter(v => v.toLowerCase().includes(versionSearch.toLowerCase()))
  }, [mcVersions, versionSearch])

  const matchingVersions = useMemo(() => {
    if (!selectedMcVersion || !selectedLoader) return []

    const filtered = contextualVersions.filter((version) => {
      const mcMatch = getVersionGameVersions(version).includes(selectedMcVersion)
      const loaderMatch = getVersionLoaders(version).includes(selectedLoader)
      return mcMatch && loaderMatch && version.files?.length > 0
    })

    return pickCompatibleVersionsByChannel(filtered)
  }, [contextualVersions, selectedMcVersion, selectedLoader])

  useEffect(() => {
    if (matchingVersions.length === 0) {
      setSelectedCompatibleVersionId('')
      return
    }
    const currentStillValid = matchingVersions.some(
      (version) => version.id === selectedCompatibleVersionId,
    )
    if (!currentStillValid) {
      const preferred =
        matchingVersions.find((version) => version.version_type === 'release') ||
        matchingVersions[0]
      setSelectedCompatibleVersionId(preferred.id)
    }
  }, [matchingVersions, selectedCompatibleVersionId])

  const matchingVersion = useMemo(() => {
    if (matchingVersions.length === 0) return null
    return (
      matchingVersions.find((version) => version.id === selectedCompatibleVersionId) ||
      matchingVersions[0]
    )
  }, [matchingVersions, selectedCompatibleVersionId])

  useEffect(() => {
    setDepItems([])
  }, [selectedMcVersion, selectedLoader, matchingVersion?.id])

  const buildZipName = () =>
    buildModrinthExtractZipName(mod?.title || mod?.slug, matchingVersion?.version_number)

  const getVersionFiles = () => {
    if (!matchingVersion?.files?.length) return []
    return matchingVersion.files.map((file) => ({
      url: file.url,
      filename: file.filename,
    }))
  }

  const getAllDownloadFiles = () => {
    const primaryFiles = getVersionFiles()
    const depFiles = depItems.map((item) => ({
      url: item.url,
      filename: item.filename,
    }))
    return [...primaryFiles, ...depFiles]
  }

  const handleDownloadZip = async () => {
    const files = getAllDownloadFiles()
    if (files.length === 0) return
    setZipLoading(true)
    try {
      await downloadZipBundle(files, buildZipName())
    } catch {
      await downloadFilesSequentially(files)
    } finally {
      setZipLoading(false)
    }
  }

  const handleDownloadWithDeps = async () => {
    const files = getAllDownloadFiles()
    if (files.length === 0) return
    setDepsZipLoading(true)
    try {
      await downloadFilesSequentially(files)
    } finally {
      setDepsZipLoading(false)
    }
  }

  const getLoaderName = (loader) => {
    const names = {
      'fabric': 'Fabric',
      'forge': 'Forge',
      'neoforge': 'NeoForge',
      'quilt': 'Quilt',
      'bukkit': 'Bukkit',
      'paper': 'Paper',
      'spigot': 'Spigot',
      'purpur': 'Purpur',
      'folia': 'Folia',
      'sponge': 'Sponge',
      'bungeecord': 'BungeeCord',
      'velocity': 'Velocity',
      'waterfall': 'Waterfall',
      'iris': 'Iris',
      'optifine': 'OptiFine',
      'canvas': 'Canvas',
      'vanilla': 'Vanilla',
      'datapack': 'Datapack',
    }
    return names[loader] || loader
  }

  const downloadTooltipTitle =
    typeof mod?.title === 'string' ? mod.title.trim() : ''
  const downloadTooltip = downloadTooltipTitle
    ? `Скачать ${downloadTooltipTitle}`
    : 'Скачать'

  const showDependencyDownloads =
    contentType === 'mod' ||
    contentType === 'mods' ||
    contentType === 'plugin' ||
    contentType === 'plugins' ||
    contentType === 'datapack' ||
    contentType === 'datapacks'

  const showLoaderPicker =
    allLoaders.length > 0 &&
    contentType !== 'resourcepack' &&
    contentType !== 'resourcepacks'

  const bundleFileCount = useMemo(() => {
    const primaryCount = matchingVersion?.files?.length || 0
    return primaryCount + depItems.length
  }, [matchingVersion?.files?.length, depItems.length])

  const showBundleFooter = bundleFileCount > 1

  const zipDownloadTooltip = useMemo(() => {
    const depCount = depItems.length
    const allFiles = [
      ...(matchingVersion?.files || []).map((file) => file.filename),
      ...depItems.map((item) => item.filename),
    ].filter(Boolean)
    const depTitles = depItems.map((item) => item.title).filter(Boolean)

    return (
      <span className="flex flex-col gap-1.5 text-left leading-snug">
        <span className="font-bold">Всё в одном .zip</span>
        <span className="text-xs opacity-90">
          {depCount > 0
            ? 'Один архив: основной файл и все зависимости внутри.'
            : 'Один архив с файлами выбранной версии.'}
        </span>
        {depTitles.length > 0 && (
          <span className="text-[11px] leading-tight opacity-75">
            Включая: {depTitles.slice(0, 3).join(', ')}
            {depTitles.length > 3 ? ` и ещё ${depTitles.length - 3}` : ''}
          </span>
        )}
        {allFiles.length > 0 && (
          <span className="text-[11px] font-mono leading-tight opacity-75">
            {allFiles.length} шт. в архиве
          </span>
        )}
      </span>
    )
  }, [matchingVersion, depItems])

  const depsDownloadTooltip = useMemo(() => {
    const depCount = depItems.length
    const depTitles = depItems.map((item) => item.title).filter(Boolean)
    const totalFiles = (matchingVersion?.files?.length || 0) + depCount

    return (
      <span className="flex flex-col gap-1.5 text-left leading-snug">
        <span className="font-bold">Скачать по очереди</span>
        <span className="text-xs opacity-90">
          {totalFiles > 1
            ? 'Каждый .jar скачается отдельно, один за другим — как несколько загрузок в браузере.'
            : 'Один файл скачается напрямую, без архива.'}
        </span>
        {depTitles.length > 0 && (
          <span className="text-[11px] leading-tight opacity-75">
            {mod?.title || 'Ресурс'}, затем: {depTitles.slice(0, 3).join(', ')}
            {depTitles.length > 3 ? ` и ещё ${depTitles.length - 3}` : ''}
          </span>
        )}
      </span>
    )
  }, [depItems, matchingVersion?.files?.length, mod?.title])

  return (
    <>
      <StyledTooltip label={downloadTooltip}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          data-download-modal
          className={`modrinth-download-button w-full lg:w-auto text-base${accent ? ' hover:!brightness-[1.08]' : ''}`}
          style={downloadBtnAccentStyle}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Скачать</span>
        </button>
      </StyledTooltip>

      {isOpen && portalTarget && createPortal(
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white dark:bg-modrinth-dark text-gray-900 dark:text-white rounded-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-fade-in-up transform flex flex-col"
            style={{ maxWidth: '640px', animationDelay: '0ms' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-50 dark:bg-modrinth-darker border-b border-gray-200 dark:border-none p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mod.icon_url && (
                  <img src={mod.icon_url} alt={mod.title} className="w-10 h-10 rounded-lg" referrerPolicy="no-referrer" />
                )}
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Скачать {mod.title}</h2>
              </div>
              <div className="flex items-center gap-1.5">
                {alternateDownloadFormat && (
                  <StyledTooltip
                    label={
                      <span className="text-sm leading-snug">
                        {alternateDownloadFormat.tooltip}{' '}
                        <Link
                          href={alternateDownloadFormat.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-modrinth-green hover:underline"
                          onClick={() => setIsOpen(false)}
                        >
                          {alternateDownloadFormat.linkLabel}
                        </Link>
                      </span>
                    }
                  >
                    <Link
                      href={alternateDownloadFormat.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-modrinth-green dark:text-gray-400 dark:hover:text-modrinth-green flex items-center justify-center"
                      aria-label={alternateDownloadFormat.tooltip}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M16 3h5v5" />
                        <path d="M8 3H3v5" />
                        <path d="M12 22v-8.3a4 4 0 0 0 1.172-2.828L21 7" />
                        <path d="m3 7 7.828 7.872A4 4 0 0 1 12 17.7V22" />
                      </svg>
                    </Link>
                  </StyledTooltip>
                )}
                <StyledTooltip label="Посмотреть все версии">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      window.location.href = `/${contentRoute}/${mod.slug}/versions`
                    }}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                    </svg>
                  </button>
                </StyledTooltip>
                <StyledTooltip label="Закрыть">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </StyledTooltip>
              </div>
            </div>

            <div className={`p-5 space-y-4 flex-1 overscroll-contain custom-scrollbar touch-pan-y ${openPicker ? 'overflow-visible' : 'overflow-y-auto'}`}>
              {showAppSection && (
                <>
                  <div className="flex flex-col items-center w-full">
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className={`w-fit flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold transition-all duration-200 active:scale-[0.98] text-sm${
                        accent ? ' hover:brightness-[1.08]' : ' bg-modrinth-green text-black hover:brightness-110'
                      }`}
                      style={downloadBtnAccentStyle}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 512 514" fill="currentColor">
                        <path fillRule="evenodd" d="M503.16 323.56c11.39-42.09 12.16-87.65.04-132.8C466.57 54.23 326.04-26.8 189.33 9.78 83.81 38.02 11.39 128.07.69 230.47h43.3c10.3-83.14 69.75-155.74 155.76-178.76 106.3-28.45 215.38 28.96 253.42 129.67l-42.14 11.27c-19.39-46.85-58.46-81.2-104.73-95.83l-7.74 43.84c36.53 13.47 66.16 43.84 77 84.25 15.8 58.89-13.62 119.23-67 144.26l11.53 42.99c70.16-28.95 112.31-101.86 102.34-177.02l41.98-11.23a210.2 210.2 0 0 1-3.86 84.16z" clipRule="evenodd" />
                        <path d="M321.99 504.22C185.27 540.8 44.75 459.77 8.11 323.24A257.6 257.6 0 0 1 0 275.46h43.27c1.09 11.91 3.2 23.89 6.41 35.83 3.36 12.51 7.77 24.46 13.11 35.78l38.59-23.15c-3.25-7.5-5.99-15.32-8.17-23.45-24.04-89.6 29.2-181.7 118.92-205.71 17-4.55 34.1-6.32 50.8-5.61L255.19 133c-10.46.05-21.08 1.42-31.66 4.25-66.22 17.73-105.52 85.7-87.78 151.84 1.1 4.07 2.38 8.04 3.84 11.9l49.35-29.61-14.87-39.43 46.6-47.87 58.9-12.69 17.05 20.99-27.15 27.5-23.68 7.45-16.92 17.39 8.29 23.07s16.79 17.84 16.82 17.85l23.72-6.31 16.88-18.54 36.86-11.67 10.98 24.7-38.03 46.63-63.73 20.18-28.58-31.82-49.82 29.89c25.54 29.08 63.94 45.23 103.75 41.86l11.53 42.99c-59.41 7.86-117.44-16.73-153.49-61.91l-38.41 23.04c50.61 66.49 138.2 99.43 223.97 76.48 61.74-16.52 109.79-58.6 135.81-111.78l42.64 15.5c-30.89 66.28-89.84 118.94-166.07 139.34" />
                      </svg>
                      <span>Установить в Modrinth App</span>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                      </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 w-full flex justify-center ${showLauncherHelp ? 'max-h-12 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                      <a
                        href="/app"
                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Нет Modrinth App?
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 px-4 my-2">
                    <div className="flex h-[2px] w-full rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
                    <span className="flex-shrink-0 text-sm font-semibold text-gray-500 dark:text-gray-400">или</span>
                    <div className="flex h-[2px] w-full rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
                  </div>
                </>
              )}
              <DownloadModalPickers
                selectedMcVersion={selectedMcVersion}
                selectedLoader={selectedLoader}
                filteredMcVersions={filteredMcVersions}
                loaders={loaders}
                versionSearch={versionSearch}
                onVersionSearchChange={setVersionSearch}
                showAllVersions={showAllVersions}
                hasSnapshotVersions={hasSnapshotVersions}
                onToggleShowAllVersions={() => setShowAllVersions(!showAllVersions)}
                favMcVersion={favMcVersion}
                favLoader={favLoader}
                onSelectMcVersion={selectMcVersion}
                onSelectLoader={selectLoader}
                onToggleFavoriteMcVersion={toggleFavoriteMcVersion}
                onToggleFavoriteLoader={toggleFavoriteLoader}
                getLoaderName={getLoaderName}
                showLoaderPicker={showLoaderPicker}
                openPicker={openPicker}
                onOpenPickerChange={setOpenPicker}
                LottieStar={LottieStar}
                bookmarkAnimation={bookmarkAnimation}
                noBookmarkAnimation={noBookmarkAnimation}
              />

              {matchingVersions.length > 0 && selectedMcVersion && selectedLoader && (
                <DownloadCompatibleVersions
                  versions={matchingVersions}
                  selectedVersionId={selectedCompatibleVersionId || matchingVersions[0]?.id}
                  onSelectVersionId={setSelectedCompatibleVersionId}
                />
              )}

              {matchingVersion && selectedMcVersion && selectedLoader && (
                <DownloadVersionBundledFiles
                  files={matchingVersion.files}
                  contentType={contentType}
                  loader={selectedLoader}
                />
              )}

              {showDependencyDownloads && matchingVersion && selectedLoader && selectedMcVersion && (
                <DownloadVersionDependencies
                  key={matchingVersion.id}
                  dependencies={Array.isArray(matchingVersion.dependencies) ? matchingVersion.dependencies : []}
                  loader={selectedLoader}
                  gameVersion={selectedMcVersion}
                  contentType={contentType}
                  projectSlug={mod.slug}
                  projectTitle={mod.title}
                  versionNumber={matchingVersion.version_number || matchingVersion.id}
                  onResolved={setDepItems}
                />
              )}

            </div>

            {showBundleFooter && matchingVersion && matchingVersion.files && matchingVersion.files.length > 0 && (
              <div className="border-t border-gray-200 p-4 pt-4 dark:border-[#2e3035]">
                <div className="flex flex-col gap-2 p-2 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:justify-end">
                  <DownloadFooterButton
                    onClick={handleDownloadZip}
                    loading={zipLoading}
                    disabled={depsZipLoading}
                    tooltip={zipDownloadTooltip}
                    tooltipSide="top"
                  >
                    Скачать всё в одном .zip
                  </DownloadFooterButton>
                  <DownloadFooterButton
                    variant="primary"
                    onClick={handleDownloadWithDeps}
                    loading={depsZipLoading}
                    disabled={zipLoading}
                    loadingLabel="Скачивание…"
                    tooltip={depsDownloadTooltip}
                    tooltipSide="top"
                  >
                    Скачать всё по отдельности
                  </DownloadFooterButton>
                </div>
              </div>
            )}
          </div>
        </div>,
        portalTarget
      )}
    </>
  )
}
