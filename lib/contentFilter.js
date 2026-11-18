import { rewriteRelativeContentUrls } from './relativeContentUrls'
import { getHiddenCollectionProjectIds } from './hiddenCollectionBlocks'
import { SITE_NAME, isHostOf } from './site'
import { DEFAULT_LOCALE } from './i18n/config'
import { getMessage, translate } from './i18n/translate'
import { MD_IMAGE_LINK_RE, MD_IMAGE_RE, MD_LINK_RE, replaceHtmlAnchors, replaceHtmlImages } from './htmlScan'
import { 
	isProjectBlocked as isBlocked,
	isOrganizationBlocked as isOrgBlocked,
	isUserBlocked,
	isUrlBlocked as isURLBlocked,
	replaceBlockedWords as replaceWords,
	replaceProfileWords as replaceProfile,
	isAvatarBlocked,
	isUsernameMasked,
	BLACKLIST_PATTERNS,
	BLACKLIST_PROJECTS,
	BLACKLIST_ORGANIZATIONS,
	BLACKLIST_WORDS,
	BLACKLIST_AVATARS
} from './blacklistManager'

export { BLACKLIST_PATTERNS, BLACKLIST_PROJECTS, BLACKLIST_ORGANIZATIONS, BLACKLIST_WORDS, BLACKLIST_AVATARS }

export { normalizeProjectSlug } from './projectSlug'

export async function isProjectBlocked(slug, id = null) {
  if (isBlocked(slug, id)) return true
  const hidden = await getHiddenCollectionProjectIds()
  if (id && hidden.has(String(id))) return true
  if (slug && hidden.has(String(slug))) return true
  return false
}

export function isOrganizationBlocked(organization) {
  return isOrgBlocked(organization)
}

export async function isProjectAccessDenied(slug, project = null) {
  if (await isProjectBlocked(slug, project?.id ?? null)) return true
  if (!project) return false
  if (await isProjectBlocked(project.slug, project.id)) return true
  return isOrganizationBlocked(project.organization ?? project.organization_id)
}

export { isUserBlocked }

export function isUrlBlocked(url) {
  return isURLBlocked(url)
}

export function replaceBlockedWords(text) {
  return replaceWords(text)
}

const ICON_VERSION = '2'

export function filterAvatar(avatarUrl) {
  if (!avatarUrl) return null
  if (isAvatarBlocked(avatarUrl)) {
    return `/icon.png?v=${ICON_VERSION}`
  }
  return avatarUrl
}

export function getPublicUsername(userOrName, userId = null) {
  let username = userOrName
  let id = userId

  if (userOrName && typeof userOrName === 'object') {
    id = userOrName.id ?? userId
    username = userOrName.username
  }

  if (!username && id) return id
  if (!username) return ''

  if (isUsernameMasked(username, id)) {
    return id || username
  }

  return username
}

export function filterUserPublic(user) {
  if (!user) return user

  return {
    ...user,
    username: getPublicUsername(user),
    avatar_url: filterAvatar(user.avatar_url),
    bio: user.bio ? replaceProfile(replaceBlockedWords(user.bio)) : user.bio,
  }
}

export function filterTeamMembers(teamMembers) {
  if (!teamMembers || !Array.isArray(teamMembers)) return []
  
  return teamMembers.map(member => ({
    ...member,
    user: filterUserPublic(member.user),
  }))
}

export function filterOrganizationMembers(members) {
  if (!members || !Array.isArray(members)) return []

  return filterTeamMembers(members).filter((member) => !isUserBlocked(member.user?.id))
}

export function filterOrganization(organization) {
  if (!organization) return organization

  return {
    ...organization,
    name: replaceBlockedWords(organization.name || ''),
    description: replaceBlockedWords(organization.description || ''),
    icon_url: filterAvatar(organization.icon_url),
    members: filterOrganizationMembers(organization.members),
  }
}



export function convertModrinthUrl(url) {
  if (!url) return url
  
  const modRegex = /https?:\/\/(www\.)?modrinth\.com\/mod\/([^\/\?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?/i
  const modMatch = url.match(modRegex)
  
  if (modMatch) {
    const slug = modMatch[2]
    const path = modMatch[3] || ''
    const query = modMatch[4] || ''
    return `/mod/${slug}${path}${query}`
  }
  
  const pluginRegex = /https?:\/\/(www\.)?modrinth\.com\/plugin\/([^\/\?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?/i
  const pluginMatch = url.match(pluginRegex)
  
  if (pluginMatch) {
    const slug = pluginMatch[2]
    const path = pluginMatch[3] || ''
    const query = pluginMatch[4] || ''
    return `/plugin/${slug}${path}${query}`
  }
  
  const resourcepackRegex = /https?:\/\/(www\.)?modrinth\.com\/resourcepack\/([^\/\?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?/i
  const resourcepackMatch = url.match(resourcepackRegex)
  
  if (resourcepackMatch) {
    const slug = resourcepackMatch[2]
    const path = resourcepackMatch[3] || ''
    const query = resourcepackMatch[4] || ''
    return `/resourcepacks/${slug}${path}${query}`
  }
  
  const datapackRegex = /https?:\/\/(www\.)?modrinth\.com\/datapack\/([^\/\?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?/i
  const datapackMatch = url.match(datapackRegex)
  
  if (datapackMatch) {
    const slug = datapackMatch[2]
    const path = datapackMatch[3] || ''
    const query = datapackMatch[4] || ''
    return `/datapacks/${slug}${path}${query}`
  }
  
  const shaderRegex = /https?:\/\/(www\.)?modrinth\.com\/shader\/([^\/\?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?/i
  const shaderMatch = url.match(shaderRegex)
  
  if (shaderMatch) {
    const slug = shaderMatch[2]
    const path = shaderMatch[3] || ''
    const query = shaderMatch[4] || ''
    return `/shaders/${slug}${path}${query}`
  }
  
  const modpackRegex = /https?:\/\/(www\.)?modrinth\.com\/modpack\/([^\/\?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?/i
  const modpackMatch = url.match(modpackRegex)
  
  if (modpackMatch) {
    const slug = modpackMatch[2]
    const path = modpackMatch[3] || ''
    const query = modpackMatch[4] || ''
    return `/modpacks/${slug}${path}${query}`
  }

  const projectRegex = /https?:\/\/(www\.)?modrinth\.com\/project\/([^\/\?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?/i
  const projectMatch = url.match(projectRegex)

  if (projectMatch) {
    const slug = projectMatch[2]
    const path = projectMatch[3] || ''
    const query = projectMatch[4] || ''
    return `/project/${slug}${path}${query}`
  }
  
  const collectionRegex = /https?:\/\/(www\.)?modrinth\.com\/collection\/([^\/\?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?/i
  const collectionMatch = url.match(collectionRegex)

  if (collectionMatch) {
    const slug = collectionMatch[2]
    const path = collectionMatch[3] || ''
    const query = collectionMatch[4] || ''
    return `/collection/${slug}${path}${query}`
  }

  return url
}


export function replaceModrinthLinks(content) {
  if (!content) return content
  
  let filtered = content.replace(/https?:\/\/(www\.)?modrinth\.com\/(mod|plugin|modpack|resourcepack|datapack|shader|project|collection)\/[a-zA-Z0-9_-]+([\/\?#][^\s"'<>)]*)?/gi, 
    (match) => {
      return convertModrinthUrl(match)
    }
  )
  
  return filtered
}


const BLOCKED_NOTICE_KEYS = {
  image: { host: 'blockedNotice.imageHost', plain: 'blockedNotice.image' },
  link: { host: 'blockedNotice.linkHost', plain: 'blockedNotice.link' },
}

function escapeHtmlText(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function blockedNoticeText(kind, host, showHost, locale = DEFAULT_LOCALE) {
  const keys = BLOCKED_NOTICE_KEYS[kind]
  return showHost
    ? translate(locale, keys.host, { host: escapeHtmlText(host) })
    : translate(locale, keys.plain)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

let blockedNoticePatterns = null

function getBlockedNoticePatterns() {
  if (blockedNoticePatterns) return blockedNoticePatterns
  blockedNoticePatterns = []
  for (const [kind, keys] of Object.entries(BLOCKED_NOTICE_KEYS)) {
    for (const withHost of [true, false]) {
      const template = String(getMessage(DEFAULT_LOCALE, withHost ? keys.host : keys.plain) ?? '')
      const source = escapeRegExp(template).replace(escapeRegExp('{host}'), '([^<\\s]+)')
      blockedNoticePatterns.push({ kind, withHost, re: new RegExp(`<span>${source}</span>`, 'g') })
    }
  }
  return blockedNoticePatterns
}

export function localizeBlockedNotices(content, locale = DEFAULT_LOCALE) {
  if (!content || typeof content !== 'string' || locale === DEFAULT_LOCALE) return content
  if (!content.includes('blocked-content')) return content
  let result = content
  for (const { kind, withHost, re } of getBlockedNoticePatterns()) {
    result = result.replace(re, (_, host) => `<span>${blockedNoticeText(kind, host, withHost, locale)}</span>`)
  }
  return result
}

export function filterImages(content, locale = DEFAULT_LOCALE) {
  if (!content) return content
  
  let filtered = replaceHtmlImages(content, (match, url) => {
    if (isUrlBlocked(url)) {
      let host
      let showHost = false
      try { 
        host = new URL(url).hostname
        showHost = isHostOf(host, 'modrinth.com') || isHostOf(host, SITE_NAME)
      } catch (e) {
        host = url
      }
      const message = blockedNoticeText('image', host, showHost, locale)
      return `<div class="blocked-content flex w-fit max-w-2xl mx-auto shrink-0 flex-wrap items-center justify-center gap-3 rounded-xl bg-linear-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-sm text-red-200 shadow-lg">
  <svg class="w-5 h-5 text-red-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>
  <span>${message}</span>
</div>\n\n`
    }
    return match
  })
  
  filtered = filtered.replace(MD_IMAGE_RE, (match, alt, url) => {
    if (isUrlBlocked(url)) {
      let host
      let showHost = false
      try {
        host = new URL(url).hostname
        showHost = isHostOf(host, 'modrinth.com') || isHostOf(host, SITE_NAME)
      } catch (e) {
        host = url
      }
      const message = blockedNoticeText('image', host, showHost, locale)
      return `<div class="blocked-content flex w-fit max-w-2xl mx-auto shrink-0 flex-wrap items-center justify-center gap-3 rounded-xl bg-linear-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-sm text-red-200 shadow-lg">
  <svg class="w-5 h-5 text-red-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>
  <span>${message}</span>
</div>\n\n`
    }
    return match
  })
  
  return filtered
}

export function filterLinks(content, locale = DEFAULT_LOCALE) {
  if (!content) return content
  
  let filtered = replaceHtmlAnchors(content, (match, url) => {
    if (url) {
      if (isUrlBlocked(url)) {
        let host
        let showHost = false
        try { 
          host = new URL(url).hostname
          showHost = isHostOf(host, 'modrinth.com') || isHostOf(host, SITE_NAME)
        } catch (e) { 
          host = url 
        }
        const message = blockedNoticeText('link', host, showHost, locale)
        return `<div class="blocked-content flex w-fit max-w-2xl mx-auto shrink-0 flex-wrap items-center justify-center gap-3 rounded-xl bg-linear-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-sm text-red-200 shadow-lg">
  <svg class="w-5 h-5 text-red-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>
  <span>${message}</span>
</div>\n\n`
      }
    }
    return match
  })
  
  filtered = filtered.replace(MD_IMAGE_LINK_RE, (match, alt, imgUrl, linkUrl) => {
    if (isUrlBlocked(linkUrl) || isUrlBlocked(imgUrl)) {
      let host
      let showHost = false
      try {
        const blockedUrl = isUrlBlocked(linkUrl) ? linkUrl : imgUrl
        host = new URL(blockedUrl).hostname
        showHost = isHostOf(host, 'modrinth.com') || isHostOf(host, SITE_NAME)
      } catch (e) {
        host = isUrlBlocked(linkUrl) ? linkUrl : imgUrl
      }
      const message = blockedNoticeText('link', host, showHost, locale)
      return `<div class="blocked-content flex w-fit max-w-2xl mx-auto shrink-0 flex-wrap items-center justify-center gap-3 rounded-xl bg-linear-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-sm text-red-200 shadow-lg">
  <svg class="w-5 h-5 text-red-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>
  <span>${message}</span>
</div>\n\n`
    }
    return match
  })
  
  filtered = filtered.replace(MD_LINK_RE, (match, text, url) => {
    if (isUrlBlocked(url)) {
      let host
      let showHost = false
      try { 
        host = new URL(url).hostname
        showHost = isHostOf(host, 'modrinth.com') || isHostOf(host, SITE_NAME)
      } catch (e) { 
        host = url 
      }
      const message = blockedNoticeText('link', host, showHost, locale)
      return `<div class="blocked-content flex w-fit max-w-2xl mx-auto shrink-0 flex-wrap items-center justify-center gap-3 rounded-xl bg-linear-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-sm text-red-200 shadow-lg">
  <svg class="w-5 h-5 text-red-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>
  <span>${message}</span>
</div>\n\n`
    }
    return match
  })
  
  return filtered
}


export function filterModContent(mod) {
  if (!mod) return mod
  
  let body = mod.body
  let description = mod.description
  let title = mod.title
  let icon_url = mod.icon_url
  
  const urlContext = { sourceUrl: mod.source_url, license: mod.license }
  body = rewriteRelativeContentUrls(body, urlContext)
  description = rewriteRelativeContentUrls(description, urlContext)

  body = replaceModrinthLinks(body)
  description = replaceModrinthLinks(description)
  
  body = filterLinks(body)
  description = filterLinks(description)
  
  body = filterImages(body)
  description = filterImages(description)
  
  body = replaceBlockedWords(body)
  description = replaceBlockedWords(description)
  title = replaceBlockedWords(title)
  
  icon_url = filterAvatar(icon_url)
  
  return {
    ...mod,
    body,
    description,
    title,
    icon_url,
  }
}

export function filterGalleryImages(gallery) {
  if (!gallery || !Array.isArray(gallery)) return []
  
  return gallery.map(image => {
    const isBlocked = isUrlBlocked(image.url) || isUrlBlocked(image.raw_url)
    
    return {
      ...image,
      isBlocked,
      blockedHost: isBlocked ? (() => {
        try {
          return new URL(image.url).hostname
        } catch (e) {
          return 'неизвестный источник'
        }
      })() : null
    }
  })
}

export async function filterModsList(mods) {
  const originalCount = mods.length
  let blockedByProject = 0
  let blockedByOrganization = 0
  const hidden = await getHiddenCollectionProjectIds()
  
  const filtered = mods
    .filter(mod => {
      const projectId = mod.id ?? mod.project_id
      if (
        isBlocked(mod.slug, projectId) ||
        (projectId && hidden.has(String(projectId))) ||
        (mod.slug && hidden.has(String(mod.slug)))
      ) {
        blockedByProject++
        return false
      }
      return true
    })
    .filter(mod => {
      if (isOrganizationBlocked(mod.organization)) {
        blockedByOrganization++
        return false
      }
      return true
    })
    .map(mod => ({
      ...mod,
      icon_url: filterAvatar(mod.icon_url),
      title: replaceBlockedWords(mod.title || ''),
      description: replaceBlockedWords(replaceModrinthLinks(mod.description || '')),
      ...(mod.author != null
        ? { author: getPublicUsername(mod.author, mod.author_id) }
        : {}),
    }))
  
  return {
    hits: filtered,
    blockedCount: originalCount - filtered.length,
    blockedByProject,
    blockedByOrganization
  }
}


export function filterVersionChangelog(changelog, locale = DEFAULT_LOCALE) {
  if (!changelog) return changelog
  
  let filtered = changelog
  
  filtered = replaceModrinthLinks(filtered)
  filtered = filterLinks(filtered, locale)
  filtered = filterImages(filtered, locale)
  filtered = replaceBlockedWords(filtered)
  
  return filtered
}
