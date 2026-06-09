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

export function isProjectBlocked(slug, id = null) {
  return isBlocked(slug, id)
}

export function isOrganizationBlocked(organization) {
  return isOrgBlocked(organization)
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
    return `/plugins/${slug}${path}${query}`
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
  
  return url
}


export function replaceModrinthLinks(content) {
  if (!content) return content
  
  let filtered = content.replace(/https?:\/\/(www\.)?modrinth\.com\/(mod|plugin|modpack|resourcepack|datapack|shader)\/[a-zA-Z0-9_-]+([\/\?#][^\s"'<>)]*)?/gi, 
    (match) => {
      return convertModrinthUrl(match)
    }
  )
  
  return filtered
}


export function filterImages(content) {
  if (!content) return content
  
  let filtered = content.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (match, url) => {
    if (isUrlBlocked(url)) {
      let host
      let showHost = false
      try { 
        host = new URL(url).hostname
        showHost = host.includes('modrinth.com') || host.includes('modrinth.black')
      } catch (e) { 
        host = url 
      }
      const message = showHost ? `Изображение с ${host} заблокировано по требованию РКН` : 'Изображение заблокировано по требованию РКН'
      return `<div class="blocked-content flex w-fit max-w-2xl mx-auto shrink-0 flex-wrap items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-sm text-red-200 shadow-lg">
  <svg class="w-5 h-5 text-red-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>
  <span>${message}</span>
</div>\n\n`
    }
    return match
  })
  
  filtered = filtered.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    if (isUrlBlocked(url)) {
      let host
      let showHost = false
      try { 
        host = new URL(url).hostname
        showHost = host.includes('modrinth.com') || host.includes('modrinth.black')
      } catch (e) { 
        host = url 
      }
      const message = showHost ? `Изображение с ${host} заблокировано по требованию РКН` : 'Изображение заблокировано по требованию РКН'
      return `<div class="blocked-content flex w-fit max-w-2xl mx-auto shrink-0 flex-wrap items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-sm text-red-200 shadow-lg">
  <svg class="w-5 h-5 text-red-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>
  <span>${message}</span>
</div>\n\n`
    }
    return match
  })
  
  return filtered
}

export function filterLinks(content) {
  if (!content) return content
  
  let filtered = content.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>.*?<\/a>/gi, (match) => {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i)
    if (hrefMatch && hrefMatch[1]) {
      const url = hrefMatch[1]
      if (isUrlBlocked(url)) {
        let host
        let showHost = false
        try { 
          host = new URL(url).hostname
          showHost = host.includes('modrinth.com') || host.includes('modrinth.black')
        } catch (e) { 
          host = url 
        }
        const message = showHost ? `Ссылка на ${host} заблокирована по требованию РКН` : 'Ссылка заблокирована по требованию РКН'
        return `<div class="blocked-content flex w-fit max-w-2xl mx-auto shrink-0 flex-wrap items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-sm text-red-200 shadow-lg">
  <svg class="w-5 h-5 text-red-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>
  <span>${message}</span>
</div>\n\n`
      }
    }
    return match
  })
  
  filtered = filtered.replace(/\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g, (match, alt, imgUrl, linkUrl) => {
    if (isUrlBlocked(linkUrl) || isUrlBlocked(imgUrl)) {
      let host
      let showHost = false
      try { 
        const blockedUrl = isUrlBlocked(linkUrl) ? linkUrl : imgUrl
        host = new URL(blockedUrl).hostname
        showHost = host.includes('modrinth.com') || host.includes('modrinth.black')
      } catch (e) { 
        host = isUrlBlocked(linkUrl) ? linkUrl : imgUrl 
      }
      const message = showHost ? `Ссылка на ${host} заблокирована по требованию РКН` : 'Ссылка заблокирована по требованию РКН'
      return `<div class="blocked-content flex w-fit max-w-2xl mx-auto shrink-0 flex-wrap items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-sm text-red-200 shadow-lg">
  <svg class="w-5 h-5 text-red-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>
  <span>${message}</span>
</div>\n\n`
    }
    return match
  })
  
  filtered = filtered.replace(/(?<!\!)\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    if (isUrlBlocked(url)) {
      let host
      let showHost = false
      try { 
        host = new URL(url).hostname
        showHost = host.includes('modrinth.com') || host.includes('modrinth.black')
      } catch (e) { 
        host = url 
      }
      const message = showHost ? `Ссылка на ${host} заблокирована по требованию РКН` : 'Ссылка заблокирована по требованию РКН'
      return `<div class="blocked-content flex w-fit max-w-2xl mx-auto shrink-0 flex-wrap items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-sm text-red-200 shadow-lg">
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

export function filterModsList(mods) {
  const originalCount = mods.length
  let blockedByProject = 0
  let blockedByOrganization = 0
  
  const filtered = mods
    .filter(mod => {
      if (isProjectBlocked(mod.slug, mod.id ?? mod.project_id)) {
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


export function filterVersionChangelog(changelog) {
  if (!changelog) return changelog
  
  let filtered = changelog
  
  filtered = replaceModrinthLinks(filtered)
  filtered = filterLinks(filtered)
  filtered = filterImages(filtered)
  filtered = replaceBlockedWords(filtered)
  
  return filtered
}

