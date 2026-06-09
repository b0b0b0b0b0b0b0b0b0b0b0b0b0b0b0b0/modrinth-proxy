import Link from 'next/link'
import { formatDownloads, formatDate, formatFileSize, groupVersionsByMajor, resolveModrinthProjectAccent } from '@/lib/modrinth'
import { filterVersionChangelog, filterUserPublic } from '@/lib/contentFilter'
import { CATEGORIES } from '@/lib/categories'
import { RESOURCEPACK_CATEGORIES } from '@/lib/resourcepackCategories'
import { SHADER_STYLES, SHADER_FEATURES, SHADER_PERFORMANCE } from '@/lib/shaderCategories'
import { LOADERS } from '@/lib/loaders'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import CopyButton from './CopyButton'
import ContentNavigation from './ContentNavigation'
import ResourceHeader from './ResourceHeader'
import RelativeTime from './RelativeTime'

class VersionPageData {
  constructor(project, version) {
    this.project = project
    this.version = version
  }

  getPrimaryFile() {
    return this.version.files.find(f => f.primary) || this.version.files[0]
  }

  getSecondaryFiles() {
    return this.version.files.filter(f => !f.primary)
  }

  getVersionTypeInfo() {
    const types = {
      release: { color: 'green', label: 'Release' },
      beta: { color: 'yellow', label: 'Beta' },
      alpha: { color: 'red', label: 'Alpha' }
    }
    return types[this.version.version_type] || types.release
  }
}

class VersionMetadata {
  constructor(version, author) {
    this.version = version
    this.author = author ? filterUserPublic(author) : null
  }

  render() {
    const versionType = this.getVersionTypeInfo()
    
    return (
      <div className="bg-modrinth-dark border border-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-3">Метаданные</h2>
        <div className="space-y-3.5">
          <MetadataItem
            label="Канал релиза"
            value={
              <span className={`inline-block px-3 py-1 rounded-full bg-${versionType.color}-900 text-${versionType.color}-300 font-semibold text-sm`}>
                {versionType.label}
              </span>
            }
          />
          <MetadataItem label="Номер версии" value={this.version.version_number} />
          <MetadataItem
            label="Загрузчики"
            value={
              <div className="flex flex-wrap gap-1.5">
                {this.version.loaders.filter(l => l !== 'minecraft').map(loaderId => {
                  const loaderData = LOADERS.find(l => l.id === loaderId)
                  if (!loaderData) return null
                  
                  return (
                    <span 
                      key={loaderId} 
                      className="inline-flex items-center gap-1.5 text-sm font-medium"
                      style={{ color: loaderData.color || 'var(--text-secondary)' }}
                    >
                      <div className="w-4 h-4 flex-shrink-0">
                        {loaderData.icon}
                      </div>
                      {loaderData.name}
                    </span>
                  )
                })}
              </div>
            }
          />
          <MetadataItem
            label="Версии игры"
            value={
              <span className="text-sm">
                {formatVersionsCompact(this.version.game_versions)}
              </span>
            }
          />
          <MetadataItem label="Загрузок" value={formatDownloads(this.version.downloads)} />
          <MetadataItem label="Дата публикации" value={<RelativeTime dateString={this.version.date_published} />} />
          <MetadataItem
            label="Загрузил"
                          value={
                <div className="flex items-center gap-2">
                  {this.author && (
                    <>
                      {this.author.avatar_url && (
                        <img 
                          src={this.author.avatar_url} 
                          alt={this.author.username}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <Link href={`/user/${this.author.id}`} className="font-semibold hover:text-modrinth-green transition-colors">
                        {this.author.username}
                      </Link>
                    </>
                  )}
                  {!this.author && (
                    <span className="text-gray-400">{this.version.author_id}</span>
                  )}
                </div>
              }
          />
          <MetadataItem label="ID версии" value={
            <CopyButton text={this.version.id} />
          } />
        </div>
      </div>
    )
  }

  getVersionTypeInfo() {
    const types = {
      release: { color: 'green', label: 'Release' },
      beta: { color: 'yellow', label: 'Beta' },
      alpha: { color: 'red', label: 'Alpha' }
    }
    return types[this.version.version_type] || types.release
  }
}

function MetadataItem({ label, value }) {
  return (
    <div>
      <h4 className="text-base font-bold mb-1.5 text-[var(--text-gray)]">{label}</h4>
      <div className="text-white text-sm">{value}</div>
    </div>
  )
}

function formatVersionsCompact(versions) {
  if (!versions || versions.length === 0) return ''
  
  const releaseVersions = versions.filter(v => {
    return /^\d+\.\d+(\.\d+)?$/.test(v) && !v.includes('-')
  }).sort((a, b) => {
    const aParts = a.split('.').map(n => parseInt(n) || 0)
    const bParts = b.split('.').map(n => parseInt(n) || 0)
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const diff = (aParts[i] || 0) - (bParts[i] || 0)
      if (diff !== 0) return diff
    }
    return 0
  })
  
  const snapshotVersions = versions.filter(v => /^\d+w\d+[a-z]/.test(v)).sort((a, b) => {
    const aMatch = a.match(/^(\d+)w(\d+)/)
    const bMatch = b.match(/^(\d+)w(\d+)/)
    if (aMatch && bMatch) {
      const aYear = parseInt(aMatch[1])
      const bYear = parseInt(bMatch[1])
      if (aYear !== bYear) return bYear - aYear
      return parseInt(bMatch[2]) - parseInt(aMatch[2])
    }
    return b.localeCompare(a)
  })
  
  const parts = []
  
  if (releaseVersions.length > 0) {
    const minVersion = releaseVersions[0]
    const maxVersion = releaseVersions[releaseVersions.length - 1]
    if (minVersion === maxVersion) {
      parts.push(minVersion)
    } else {
      parts.push(`${minVersion}–${maxVersion}`)
    }
  }
  
  if (snapshotVersions.length > 0) {
    parts.push(snapshotVersions[0])
  }
  
  return parts.join(', ')
}

class FilesList {
  constructor(files, projectAccent) {
    this.files = files
    this.projectAccent = projectAccent
  }

  render() {
    return (
      <div className="bg-modrinth-dark border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold mb-3">Файлы</h2>
        <div className="space-y-2">
          {this.files.map(file => (
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
    <div
      className={`rounded-xl p-2 transition ${rowChrome}`}
      style={rowStyleInactive}
    >
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
  const pageData = new VersionPageData(project, version)
  const primaryFile = pageData.getPrimaryFile()
  const versionType = pageData.getVersionTypeInfo()
  const metadata = new VersionMetadata(version, author)
  const projectAccent = resolveModrinthProjectAccent(project.color)
  const filesList = new FilesList(version.files, projectAccent)

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={project} contentType={contentType} versions={versions} />
      
      <ContentNavigation slug={project.slug} contentType={singularName} versionsCount={versions.length || 0} galleryCount={galleryCount || 0} projectColor={project.color} />

      <div className="bg-modrinth-dark border border-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <Link 
            href={`/${singularName}/${project.slug}?tab=versions`}
            className="hover:text-modrinth-green transition-colors"
          >
            Все версии
          </Link>
          <span>→</span>
          <span className="text-white font-semibold">{version.name}</span>
        </div>
        <h2 className="text-xl font-bold mb-2">{version.name}</h2>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${versionType.color}-900 text-${versionType.color}-300`}>
            {versionType.label}
          </span>
          <RelativeTime dateString={version.date_published} className="text-gray-400 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div>
          {version.changelog && (
            <div className="bg-modrinth-dark border border-gray-800 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-bold mb-3">Список изменений</h2>
              <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {filterVersionChangelog(version.changelog)}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {filesList.render()}
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          {metadata.render()}
        </div>
      </div>
    </div>
  )
}


