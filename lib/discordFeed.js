import { getSiteCommits } from './commits'
import { filterAvatar, isProjectAccessDenied, replaceBlockedWords } from './contentFilter'
import { getDb, getMeta, setMeta } from './db'
import { card, clip, linkButton, SITE_ACCENT } from './discordEmbed'
import { DEFAULT_LOCALE } from './i18n/config'
import { translate } from './i18n/translate'
import { getLoaderDisplayName } from './loaders'
import { compressVersionRanges, formatDownloads, MODRINTH_API, modrinthRequestHeaders } from './modrinth'
import { SITE_ORIGIN } from './site'

const WEBHOOK_RE = /^https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/
const COMPONENTS_V2 = 1 << 15
const TIMEOUT_MS = 15000
const NEWS_EVERY_MS = 2 * 60 * 1000
const UPDATES_EVERY_MS = 10 * 60 * 1000
const MIN_DOWNLOADS = 500_000
const POSTS_PER_RUN = 5
const POST_GAP_MS = 2500
const SEARCH_LIMIT = 100
const PROJECT_TYPES = ['mod', 'shader', 'resourcepack', 'modpack']
const PATHS = { mod: 'mod', shader: 'shader', resourcepack: 'resourcepack', modpack: 'modpack' }
const PLUGIN_LOADERS = new Set(['bukkit', 'spigot', 'paper', 'purpur', 'folia', 'bungeecord', 'velocity', 'waterfall', 'sponge'])

const t = (key, vars) => translate(DEFAULT_LOCALE, key, vars)

function webhook(name) {
  const url = process.env[name] || ''
  return WEBHOOK_RE.test(url) ? url : ''
}

export function discordFeedEnabled() {
  return Boolean(webhook('DISCORD_WEBHOOK_NEWS') || webhook('DISCORD_WEBHOOK_UPDATES'))
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function post(url, built) {
  try {
    const response = await fetch(`${url}?wait=true&with_components=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flags: COMPONENTS_V2, components: [built.component], allowed_mentions: { parse: [] } }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (response.ok) return { ok: true }
    const data = await response.json().catch(() => null)
    if (response.status === 429) return { ok: false, retryAfter: Math.ceil(Number(data?.retry_after) || 30) }
    console.warn(`[discord] webhook ${response.status}: ${JSON.stringify(data).slice(0, 300)}`)
    return { ok: false }
  } catch {
    return { ok: false }
  }
}

function commitText(message) {
  const body = String(message || '')
    .split('\n')
    .filter((line) => !/^[\w-]+-by:/i.test(line.trim()))
    .join('\n')
    .trim()
    .replace(/^котификс:\s*/i, '')
  return body.split(/\n\s*\n/)[0] || ''
}

function newsCard(commit) {
  return card({
    accent: SITE_ACCENT,
    text: clip(commitText(commit.commit?.message), 900),
    buttons: [linkButton(t('nav.news'), `${SITE_ORIGIN}/news`), linkButton(t('tg.btnSite'), SITE_ORIGIN)],
  })
}

async function newsRun() {
  const url = webhook('DISCORD_WEBHOOK_NEWS')
  if (!url) return
  const commits = await getSiteCommits()
  if (!commits.length) return
  const last = getMeta('discord_news_sha')
  const index = last ? commits.findIndex((commit) => commit.sha === last) : -1
  const fresh = index === -1 ? (last === commits[0].sha ? [] : [commits[0]]) : commits.slice(0, index)
  for (const commit of fresh.reverse()) {
    if (!commitText(commit.commit?.message)) {
      setMeta('discord_news_sha', commit.sha)
      continue
    }
    const result = await post(url, newsCard(commit))
    if (!result.ok) {
      if (result.retryAfter) globalThis.__discordFeedPause = Date.now() + result.retryAfter * 1000
      return
    }
    setMeta('discord_news_sha', commit.sha)
    await sleep(POST_GAP_MS)
  }
}

async function modrinthJson(path) {
  const response = await fetch(`${MODRINTH_API}${path}`, {
    headers: modrinthRequestHeaders(),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Modrinth ${response.status}`)
  return response.json()
}

function recentlyUpdated() {
  const facets = [PROJECT_TYPES.map((type) => `project_type:${type}`), [`downloads>=${MIN_DOWNLOADS}`]]
  const params = new URLSearchParams({ index: 'updated', limit: String(SEARCH_LIMIT), facets: JSON.stringify(facets) })
  return modrinthJson(`/search?${params}`).then((data) => (Array.isArray(data?.hits) ? data.hits : []))
}

function plainText(markdown) {
  return replaceBlockedWords(
    String(markdown || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/^[\s>#*-]+/gm, '')
      .replace(/[*_`~|]/g, ''),
  )
}

function projectPath(hit, version) {
  const loaders = version?.loaders || []
  if (hit.project_type === 'mod' && loaders.length && loaders.every((loader) => PLUGIN_LOADERS.has(loader))) return 'plugin'
  if (hit.project_type === 'mod' && loaders.length && loaders.every((loader) => loader === 'datapack')) return 'datapack'
  return PATHS[hit.project_type] || 'project'
}

function externalImage(url) {
  return typeof url === 'string' && url.startsWith('https://') ? url : null
}

function updateCard(hit, version) {
  const url = `${SITE_ORIGIN}/${projectPath(hit, version)}/${encodeURIComponent(hit.slug || hit.project_id)}`
  const loaders = (version.loaders || []).filter((loader) => loader !== 'minecraft').slice(0, 4).map(getLoaderDisplayName)
  const games = compressVersionRanges(version.game_versions || []).slice(0, 3).join(', ')
  const details = [
    loaders.join(', '),
    games ? `Minecraft ${games}` : '',
    `⬇ ${formatDownloads(hit.downloads)}`,
  ]
    .filter(Boolean)
    .join(' · ')
  return card({
    accent: Number.isInteger(hit.color) && hit.color > 0 ? hit.color : SITE_ACCENT,
    title: clip(`${hit.title} ${version.version_number || ''}`, 100),
    text: clip(plainText(version.changelog) || hit.description, 300),
    details,
    image: externalImage(filterAvatar(hit.icon_url)),
    buttons: [
      linkButton(t('dc.download'), `${url}#download`),
      linkButton(t('dc.open'), url),
      linkButton(t('dc.versions'), `${url}/versions`),
    ],
  })
}

function seenVersions(db) {
  return new Map(db.prepare('SELECT project_id, version_id FROM discord_feed_versions').all().map((row) => [row.project_id, row.version_id]))
}

async function updatesRun() {
  const url = webhook('DISCORD_WEBHOOK_UPDATES')
  if (!url) return
  const db = getDb()
  const hits = (await recentlyUpdated()).filter((hit) => hit.project_id && hit.latest_version && hit.downloads >= MIN_DOWNLOADS)
  const remember = db.prepare(
    `INSERT INTO discord_feed_versions (project_id, version_id) VALUES (?, ?)
     ON CONFLICT(project_id) DO UPDATE SET version_id = excluded.version_id`,
  )
  let since = Number(getMeta('discord_updates_since')) || 0
  if (!since) {
    since = Date.now()
    db.transaction(() => hits.forEach((hit) => remember.run(hit.project_id, hit.latest_version)))()
    setMeta('discord_updates_since', since)
    return
  }

  const seen = seenVersions(db)
  const pending = hits.filter((hit) => seen.get(hit.project_id) !== hit.latest_version).reverse()
  let posted = 0
  for (const hit of pending) {
    if (posted >= POSTS_PER_RUN) break
    const version = await modrinthJson(`/version/${encodeURIComponent(hit.latest_version)}`).catch(() => null)
    if (!version) continue
    const fresh = (Date.parse(version.date_published || '') || 0) > since
    const allowed = fresh && !(await isProjectAccessDenied(hit.slug, { id: hit.project_id, slug: hit.slug }))
    if (allowed) {
      const result = await post(url, updateCard(hit, version))
      if (!result.ok) {
        if (result.retryAfter) globalThis.__discordFeedPause = Date.now() + result.retryAfter * 1000
        return
      }
      posted += 1
      await sleep(POST_GAP_MS)
    }
    remember.run(hit.project_id, hit.latest_version)
  }
}

async function runEvery(key, everyMs, task) {
  const now = Date.now()
  const last = globalThis.__discordFeedLast?.[key] || 0
  if (now - last < everyMs) return
  globalThis.__discordFeedLast = { ...globalThis.__discordFeedLast, [key]: now }
  try {
    await task()
  } catch (error) {
    console.warn(`[discord] ${key} feed: ${error?.message || error}`)
  }
}

export async function discordFeedTick() {
  if (!discordFeedEnabled() || globalThis.__discordFeedBusy) return
  if ((globalThis.__discordFeedPause || 0) > Date.now()) return
  globalThis.__discordFeedBusy = true
  try {
    await runEvery('news', NEWS_EVERY_MS, newsRun)
    await runEvery('updates', UPDATES_EVERY_MS, updatesRun)
  } finally {
    globalThis.__discordFeedBusy = false
  }
}
