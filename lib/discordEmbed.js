import { getMod, getServer, formatDownloads } from './modrinth'
import { isProjectAccessDenied, replaceBlockedWords, filterAvatar } from './contentFilter'
import { getLoaderDisplayName } from './loaders'
import { compareMinecraftVersionsDesc } from './minecraftVersionSort'
import { SITE_ORIGIN } from './site'
import { DEFAULT_LOCALE, intlLocale } from './i18n/config'
import { translate } from './i18n/translate'

const DISCORD_EMBED_TYPES = ['mod', 'plugin', 'modpack', 'resourcepack', 'shader', 'datapack', 'server', 'project']
const SITE_ACCENT = 0xec7fab
const PAYLOAD_LIMIT = 3000
const DESCRIPTION_LIMITS = [280, 160, 80, 0]
const PATH_RE = /^\/([a-z]+)\/([\w.-]{1,96})(?:[/?#]|$)/
const PROJECT_TYPE_PATHS = {
  mod: 'mod',
  plugin: 'plugin',
  modpack: 'modpack',
  resourcepack: 'resourcepack',
  shader: 'shader',
  datapack: 'datapack',
  minecraft_java_server: 'server',
}
const RELEASE_RE = /^\d+\.\d+(\.\d+)?$/

const t = (key, vars) => translate(DEFAULT_LOCALE, key, vars)

function clip(text, limit) {
  const clean = replaceBlockedWords(String(text || '').replace(/\s+/g, ' ').trim())
  return clean.length > limit ? `${clean.slice(0, limit - 1).trimEnd()}…` : clean
}

function escapeMarkdown(text) {
  return String(text || '')
    .replace(/([\\*_~`|])/g, '\\$1')
    .replace(/^([#>-])/, '\\$1')
}

function linkButton(label, url) {
  return { type: 2, style: 5, label, url }
}

function card({ accent, title, text, details, image, buttons }) {
  const lines = [`# ${escapeMarkdown(title)}`, text ? escapeMarkdown(text) : '', details ? `-# ${details}` : ''].filter(Boolean)
  const body = { type: 10, content: lines.join('\n') }
  return {
    component: {
      type: 17,
      accent_color: accent ?? SITE_ACCENT,
      components: [
        image ? { type: 9, components: [body], accessory: { type: 11, media: { url: image } } } : body,
        { type: 14, divider: true, spacing: 1 },
        { type: 1, components: buttons.slice(0, 5) },
      ],
    },
  }
}

function absoluteImage(image) {
  if (!image) return null
  return image.startsWith('http') ? image : `${SITE_ORIGIN}${image}`
}

function latestRelease(versions) {
  const releases = (Array.isArray(versions) ? versions : []).filter((version) => RELEASE_RE.test(version))
  return releases.sort(compareMinecraftVersionsDesc)[0] || ''
}

function siteEmbed() {
  return card({
    title: 'ModrinthProxy',
    text: t('dc.site'),
    image: `${SITE_ORIGIN}/icon.png`,
    buttons: [
      linkButton(t('nav.mods'), `${SITE_ORIGIN}/discover/mods`),
      linkButton(t('nav.plugins'), `${SITE_ORIGIN}/discover/plugins`),
      linkButton(t('nav.shaders'), `${SITE_ORIGIN}/discover/shaders`),
      linkButton(t('nav.resourcepacks'), `${SITE_ORIGIN}/discover/resourcepacks`),
    ],
  })
}

async function projectEmbed(type, slug, descriptionLimit) {
  const project = type === 'server' ? await getServer(slug) : await getMod(slug)
  if (!project || (await isProjectAccessDenied(slug, project))) return null

  const pathType = type === 'project' ? PROJECT_TYPE_PATHS[project.project_type] || 'project' : type
  const url = `${SITE_ORIGIN}/${pathType}/${encodeURIComponent(project.slug || slug)}`
  const title = clip(project.title || project.name || slug, 100)
  const text = clip(project.description || project.summary, descriptionLimit)
  const image = absoluteImage(filterAvatar(project.icon_url))
  const accent = Number.isInteger(project.color) && project.color > 0 ? project.color : SITE_ACCENT
  const version = latestRelease(project.game_versions)

  if (pathType === 'server') {
    const online = project.minecraft_java_server?.ping?.data?.players_online ?? project.minecraft_java_server?.ping?.players_online
    const details = [
      Number.isFinite(online) ? `🟢 ${t('dc.online', { n: online.toLocaleString(intlLocale(DEFAULT_LOCALE)) })}` : '',
      version ? `Minecraft ${version}` : '',
    ]
      .filter(Boolean)
      .join(' · ')
    return card({ accent, title, text, details, image, buttons: [linkButton(t('dc.openServer'), url)] })
  }

  const loaders = (project.loaders || []).filter((loader) => loader !== 'minecraft').slice(0, 4).map(getLoaderDisplayName)
  const details = [
    `⬇ ${formatDownloads(project.downloads)}`,
    `♥ ${formatDownloads(project.followers)}`,
    loaders.join(', '),
    version ? `Minecraft ${version}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return card({
    accent,
    title,
    text,
    details,
    image,
    buttons: [
      linkButton(t('dc.download'), `${url}#download`),
      linkButton(t('dc.open'), url),
      linkButton(t('dc.versions'), `${url}/versions`),
    ],
  })
}

function serialize(embed) {
  return JSON.stringify(embed).replace(/</g, '\\u003c')
}

export async function discordEmbedJson(pathname) {
  const match = PATH_RE.exec(pathname || '')
  if (match && DISCORD_EMBED_TYPES.includes(match[1])) {
    try {
      for (const limit of DESCRIPTION_LIMITS) {
        const embed = await projectEmbed(match[1], match[2], limit)
        if (!embed) break
        const json = serialize(embed)
        if (Buffer.byteLength(json) <= PAYLOAD_LIMIT) return json
      }
    } catch {}
  }
  return serialize(siteEmbed())
}
