import Link from 'next/link'
import {
  compressVersionRanges,
  formatDownloads,
  formatFileSize,
  resolveModrinthProjectAccent,
} from '@/lib/modrinth'
import { filterVersionChangelog, filterUserPublic } from '@/lib/contentFilter'
import { LOADERS } from '@/lib/loaders'
import { getVersionPlatformIds } from '@/lib/contextualVersions'
import { IconDownload, IconHardDrive } from '@/lib/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import CopyButton from './CopyButton'
import ContentNavigation from './ContentNavigation'
import ResourceHeader from './ResourceHeader'
import RelativeTime from './RelativeTime'
import DownloadVersionDependencies from './DownloadVersionDependencies'
import VersionDeveloperInfo from './VersionDeveloperInfo'
import ProjectLinksCard from './ProjectLinksCard'
import StyledTooltip from './StyledTooltip'

const DEPENDENCY_CONTENT_TYPES = new Set(['mod', 'plugin', 'datapack'])

const VERSION_TYPE_STYLES = {
  release: {
    label: 'Release',
    className: 'bg-green-900/40 text-green-400 border-green-800',
  },
  beta: {
    label: 'Beta',
    className: 'bg-orange-900/40 text-orange-400 border-orange-800',
  },
  alpha: {
    label: 'Alpha',
    className: 'bg-red-900/40 text-red-400 border-red-800',
  },
}

const PILL_CLASS =
  'inline-flex items-center gap-1 px-2 py-1 text-sm font-normal rounded-full border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 [&_svg]:shrink-0 [&_svg]:h-4 [&_svg]:w-4'

function pickVersionLoader(version) {
  return (version.loaders || []).find((loader) => loader !== 'minecraft') || ''
}

function pickVersionGameVersion(version) {
  const gameVersions = version.game_versions || []
  const release = gameVersions.find((v) => /^\d+\.\d+(\.\d+)?$/.test(v))
  return release || gameVersions[0] || ''
}

function getVersionTypeInfo(versionType) {
  return VERSION_TYPE_STYLES[versionType] || VERSION_TYPE_STYLES.release
}

function getSupportedEnvironmentBadges(project) {
  const clientSide = project?.client_side
  const serverSide = project?.server_side
  const badges = []

  const serverOk = serverSide === 'required' || serverSide === 'optional'
  const clientOk = clientSide === 'required' || clientSide === 'optional'

  if (serverOk) {
    badges.push({
      id: 'server',
      label: 'Сервер',
      icon: <IconHardDrive className="h-4 w-4" aria-hidden />,
    })
  }
  if (clientOk) {
    badges.push({
      id: 'client',
      label: 'Одиночная игра',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    })
  }

  return badges
}

function VersionMetadata({ version, author }) {
  const safeAuthor = author ? filterUserPublic(author) : null

  return (
    <div className="bg-modrinth-dark border border-gray-800 rounded-2xl p-4">
      <h2 className="text-xl font-bold mb-3">Метаданные</h2>
      <div className="space-y-3.5">
        <MetadataItem
          label="Загрузил"
          value={
            <div className="flex items-center gap-2">
              {safeAuthor ? (
                <>
                  {safeAuthor.avatar_url && (
                    <img
                      src={safeAuthor.avatar_url}
                      alt={safeAuthor.username}
                      className="w-6 h-6 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <Link
                    href={`/user/${safeAuthor.id}`}
                    className="font-semibold hover:text-modrinth-green transition-colors"
                  >
                    {safeAuthor.username}
                  </Link>
                </>
              ) : (
                <span className="text-gray-400">{version.author_id}</span>
              )}
            </div>
          }
        />
        <MetadataItem label="ID версии" value={<CopyButton text={version.id} />} />
      </div>
    </div>
  )
}

function MetadataItem({ label, value }) {
  return (
    <div>
      <h4 className="text-base font-bold mb-1.5 text-[var(--text-gray)]">{label}</h4>
      <div className="text-white text-sm">{value}</div>
    </div>
  )
}

function VersionCompatibility({ version, project }) {
  const gameRanges = compressVersionRanges(version.game_versions || [])
  const platforms = getVersionPlatformIds(version).filter((id) => id !== 'minecraft')
  const environments = getSupportedEnvironmentBadges(project)

  if (gameRanges.length === 0 && platforms.length === 0 && environments.length === 0) {
    return null
  }

  return (
    <section id="compatibility" className="mb-6">
      <h3 className="mt-0 mb-2 text-lg font-semibold">Совместимость</h3>
      <div className="grid gap-3 md:gap-4 md:grid-cols-3">
        {gameRanges.length > 0 && (
          <div className="bg-gray-100 dark:bg-[var(--bg-tertiary)] p-4 rounded-2xl">
            <div className="text-sm text-gray-600 dark:text-gray-300">Minecraft: Java Edition</div>
            <div className="flex gap-1 flex-wrap mt-2">
              {gameRanges.map((range) => (
                <span key={range} className={PILL_CLASS}>
                  {range}
                </span>
              ))}
            </div>
          </div>
        )}

        {platforms.length > 0 && (
          <div className="bg-gray-100 dark:bg-[var(--bg-tertiary)] p-4 rounded-2xl">
            <div className="text-sm text-gray-600 dark:text-gray-300">Платформы</div>
            <div className="flex gap-1 flex-wrap mt-2">
              {platforms.map((loaderId) => {
                const loaderData = LOADERS.find((l) => l.id === loaderId)
                if (!loaderData) return null
                return (
                  <span
                    key={loaderId}
                    className={PILL_CLASS}
                    style={{ color: loaderData.color || undefined }}
                  >
                    <span className="w-4 h-4 flex-shrink-0" style={{ color: loaderData.color || undefined }}>
                      {loaderData.icon}
                    </span>
                    {loaderData.name}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {environments.length > 0 && (
          <div className="bg-gray-100 dark:bg-[var(--bg-tertiary)] p-4 rounded-2xl">
            <div className="text-sm text-gray-600 dark:text-gray-300">Поддерживаемые среды</div>
            <div className="flex gap-1 flex-wrap mt-2">
              {environments.map((env) => (
                <span key={env.id} className={PILL_CLASS}>
                  {env.icon}
                  {env.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

class FilesList {
  constructor(files, projectAccent) {
    this.files = files
    this.projectAccent = projectAccent
  }

  render() {
    return (
      <div className="bg-modrinth-dark border border-gray-800 rounded-2xl p-4 mb-6">
        <h2 className="text-xl font-bold mb-3">Файлы</h2>
        <div className="space-y-2">
          {this.files.map((file) => (
            <FileItem key={file.hashes.sha1} file={file} projectAccent={this.projectAccent} />
          ))}
        </div>
      </div>
    )
  }
}

function FileItem({ file, projectAccent }) {
  const isPrimary = file.primary
  const useAccent = Boolean(isPrimary && projectAccent)
  const dl = typeof file.url === 'string' && file.url.trim() ? file.url.trim() : null

  const rowChrome = `${
    isPrimary
      ? 'bg-[rgba(27,217,106,.25)] hover:bg-[rgba(27,217,106,.3)]'
      : 'hover:bg-[var(--bg-hover)]'
  }`
  const rowStyleInactive = !isPrimary ? { backgroundColor: 'var(--bg-tertiary)' } : {}

  const inner = (
    <>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5zM14 2v6h6" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-semibold text-white truncate">{file.filename}</span>
            <span className="text-sm text-gray-400 flex-shrink-0">({formatFileSize(file.size)})</span>
          </div>
          {isPrimary && (
            <span className="inline-block px-2 py-0.5 bg-blue-900 text-blue-300 text-xs rounded-full font-semibold">
              Основной
            </span>
          )}
        </div>
      </div>
      <span
        className={`pointer-events-none flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold ${
          isPrimary
            ? useAccent
              ? ''
              : 'bg-modrinth-green text-black'
            : 'bg-modrinth-dark text-gray-400'
        }`}
        style={
          useAccent
            ? {
                backgroundColor: projectAccent.accentHex,
                color: projectAccent.activeFgHex,
              }
            : undefined
        }
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="text-sm">Скачать</span>
      </span>
    </>
  )

  return (
    <div className={`rounded-xl p-2 transition ${rowChrome}`} style={rowStyleInactive}>
      {dl ? (
        <a href={dl} download className="flex items-center justify-between gap-3 text-inherit no-underline hover:no-underline">
          {inner}
        </a>
      ) : (
        <div className="flex items-center justify-between gap-3">{inner}</div>
      )}
    </div>
  )
}

export default function VersionPage({ project, version, author, contentType, pluralName, singularName, versions = [], galleryCount }) {
  const primaryFile = version.files?.find((f) => f.primary) || version.files?.[0]
  const versionType = getVersionTypeInfo(version.version_type)
  const projectAccent = resolveModrinthProjectAccent(project.color)
  const filesList = new FilesList(version.files || [], projectAccent)
  const downloadStyle = projectAccent
    ? { backgroundColor: projectAccent.accentHex, color: projectAccent.activeFgHex }
    : undefined

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={project} contentType={contentType} versions={versions} mutedDownload />

      <ContentNavigation
        slug={project.slug}
        contentType={singularName}
        versionsCount={versions.length || 0}
        galleryCount={galleryCount || 0}
        projectColor={project.color}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex flex-wrap gap-2 items-center">
                  <h2 className="m-0 leading-tight font-semibold text-xl sm:text-2xl">
                    {version.version_number}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1.5 leading-none rounded-full border text-sm font-normal ${versionType.className}`}
                  >
                    {versionType.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-col sm:flex-row text-sm text-gray-500 dark:text-gray-400">
                  {version.name && version.name !== version.version_number && (
                    <>
                      <span className="text-gray-700 dark:text-gray-300">{version.name}</span>
                      <span className="bg-gray-400 dark:bg-gray-600 size-1.5 rounded-full hidden sm:block" />
                    </>
                  )}
                  <span className="flex items-center gap-2">
                    <RelativeTime dateString={version.date_published} />
                    <span className="bg-gray-400 dark:bg-gray-600 size-1.5 rounded-full" />
                    <span className="flex items-center gap-1">
                      <IconDownload className="size-5" />
                      {formatDownloads(version.downloads)}
                    </span>
                  </span>
                </div>
              </div>

              {primaryFile?.url && (
                <div className="flex gap-2 flex-wrap items-center">
                  <StyledTooltip
                    contentClassName="!max-w-[260px]"
                    label={
                      <div className="flex flex-col gap-0.5 text-left">
                        <div className="text-[13px] font-semibold leading-snug break-all">
                          <span className="font-medium opacity-75">Скачать:</span>{' '}
                          {primaryFile.filename || 'файл'}
                        </div>
                        {primaryFile.size != null && primaryFile.size > 0 && (
                          <div className="text-[11px] font-normal opacity-65 leading-tight">
                            {formatFileSize(primaryFile.size)}
                          </div>
                        )}
                      </div>
                    }
                  >
                    <a
                      href={primaryFile.url}
                      download={primaryFile.filename || true}
                      className={`inline-flex items-center gap-2 h-9 px-3 rounded-xl font-semibold text-base transition hover:brightness-110 active:scale-95 ${
                        projectAccent ? '' : 'bg-modrinth-green text-black'
                      }`}
                      style={downloadStyle}
                    >
                      <IconDownload className="size-5" />
                      Скачать
                    </a>
                  </StyledTooltip>
                </div>
              )}
            </div>

            <hr className="w-full border-none h-px bg-gray-300 dark:bg-gray-800 m-0" />

            <VersionCompatibility version={version} project={project} />

            {version.changelog && (
              <section id="changes">
                <h3 className="mt-0 mb-2 text-lg font-semibold">Список изменений</h3>
                <div className="p-4 bg-gray-100 dark:bg-[var(--bg-tertiary)] rounded-2xl border border-solid border-gray-300 dark:border-gray-800">
                  <div className="prose dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {filterVersionChangelog(version.changelog)}
                    </ReactMarkdown>
                  </div>
                </div>
              </section>
            )}
          </div>

          <VersionDeveloperInfo
            projectId={version.project_id || project.id}
            versionId={version.id}
          />

          {filesList.render()}

          {DEPENDENCY_CONTENT_TYPES.has(contentType) && (
            <DownloadVersionDependencies
              dependencies={Array.isArray(version.dependencies) ? version.dependencies : []}
              loader={pickVersionLoader(version)}
              gameVersion={pickVersionGameVersion(version)}
              contentType={contentType}
              projectSlug={project.slug}
              projectTitle={project.title}
              versionNumber={version.version_number || version.id}
            />
          )}
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
          <div className="text-sm">
            <Link
              href={`/${singularName}/${project.slug}/versions`}
              className="text-gray-500 hover:text-modrinth-green transition-colors"
            >
              ← Все версии
            </Link>
          </div>
          <ProjectLinksCard resource={project} includeSource />
          <VersionMetadata version={version} author={author} />
        </div>
      </div>
    </div>
  )
}
