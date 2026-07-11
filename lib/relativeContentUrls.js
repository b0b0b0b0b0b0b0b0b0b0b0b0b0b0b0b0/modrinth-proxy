import { parseGitHubRepoFromSourceUrl } from './github'
import { getSpdxLicenseUrl, resolveLicenseHref } from './license'

const LICENSE_PATH_RE = /^(?:license|licence|copying)(?:\.(?:md|txt|rst))?$/i

function isRelativeUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('#')) return false
  return !/^[a-z][a-z0-9+.-]*:/i.test(trimmed)
}

function repoPath(url) {
  let path = url.trim()
  if (path.startsWith('./')) path = path.slice(2)
  if (path.startsWith('/')) path = path.slice(1)
  return path.split('?')[0].split('#')[0]
}

function githubBlobUrl(repo, path) {
  return `https://github.com/${repo}/blob/HEAD/${path}`
}

function githubRawUrl(repo, path) {
  return `https://raw.githubusercontent.com/${repo}/HEAD/${path}`
}

function resolveRelativeUrl(url, { sourceUrl, license }, { image = false } = {}) {
  if (!isRelativeUrl(url)) return url

  const path = repoPath(url)
  if (!path) return null

  if (LICENSE_PATH_RE.test(path)) {
    return resolveLicenseHref(license, sourceUrl) || null
  }

  const gh = parseGitHubRepoFromSourceUrl(sourceUrl)
  if (gh) {
    return image ? githubRawUrl(gh.repo, path) : githubBlobUrl(gh.repo, path)
  }

  return null
}

function rewriteMarkdownLinks(content, context) {
  return content.replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    if (!isRelativeUrl(url)) return match
    const resolved = resolveRelativeUrl(url, context)
    return resolved ? `[${text}](${resolved})` : text
  })
}

function rewriteMarkdownImages(content, context) {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    if (!isRelativeUrl(url)) return match
    const resolved = resolveRelativeUrl(url, context, { image: true })
    return resolved ? `![${alt}](${resolved})` : alt || ''
  })
}

function rewriteHtmlAnchors(content, context) {
  return content.replace(/<a([^>]+)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi, (match, before, url, after, text) => {
    if (!isRelativeUrl(url)) return match
    const resolved = resolveRelativeUrl(url, context)
    if (resolved) {
      return `<a${before}href="${resolved}"${after} rel="noopener noreferrer nofollow ugc">${text}</a>`
    }
    return text
  })
}

function rewriteHtmlImages(content, context) {
  return content.replace(/<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi, (match, before, url, after) => {
    if (!isRelativeUrl(url)) return match
    const resolved = resolveRelativeUrl(url, context, { image: true })
    if (resolved) {
      return `<img${before}src="${resolved}"${after}>`
    }
    return ''
  })
}

export function rewriteRelativeContentUrls(content, context = {}) {
  if (!content) return content

  let result = content
  result = rewriteMarkdownLinks(result, context)
  result = rewriteMarkdownImages(result, context)
  result = rewriteHtmlAnchors(result, context)
  result = rewriteHtmlImages(result, context)
  return result
}

export function isPhantomCrawlerPath(pathname) {
  if (!pathname) return false
  if (/^\/(license|licence|copying)(\.(md|txt|rst))?$/i.test(pathname)) return true
  if (/^\/banner\.webp$/i.test(pathname)) return true
  if (pathname.startsWith('/ads/')) return true
  return false
}
