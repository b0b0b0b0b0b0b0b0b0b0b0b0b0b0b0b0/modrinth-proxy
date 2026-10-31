import { getDb } from './db'
import { getModrinthTraffic } from './modrinthTraffic'

const HEAVY_PEAK_PER_MINUTE = 30
const HEAVY_SHARE = 0.05
const SHARE_MIN_TOTAL = 300
const GROUP_MIN_IPS = 3
const HEAVY_LIMIT = 40
const GROUPS_LIMIT = 10
const AGENT_MIN_PER_IP = 20

const BOT_RULES = [
  [/YandexBot|YandexRenderResourcesBot|YandexImages|YandexMobileBot|YandexAccessibilityBot/i, 'Yandex'],
  [/Googlebot|Google-InspectionTool|AdsBot-Google|GoogleOther|Mediapartners-Google/i, 'Google'],
  [/bingbot|BingPreview/i, 'Bing'],
  [/DuckDuckBot/i, 'DuckDuckGo'],
  [/Baiduspider/i, 'Baidu'],
  [/PetalBot/i, 'Petal'],
  [/AhrefsBot/i, 'Ahrefs'],
  [/SemrushBot/i, 'Semrush'],
  [/MJ12bot/i, 'Majestic'],
  [/DotBot/i, 'Moz'],
  [/GPTBot|ChatGPT-User|OAI-SearchBot/i, 'OpenAI'],
  [/ClaudeBot|Claude-User|anthropic-ai/i, 'Anthropic'],
  [/PerplexityBot/i, 'Perplexity'],
  [/Bytespider/i, 'ByteDance'],
  [/Amazonbot/i, 'Amazon'],
  [/Applebot/i, 'Apple'],
  [/facebookexternalhit|meta-externalagent/i, 'Meta'],
  [/TelegramBot/i, 'Telegram'],
  [/Discordbot/i, 'Discord'],
  [/HeadlessChrome|PhantomJS|Puppeteer|Playwright/i, 'headless'],
  [/python-requests|aiohttp|httpx|curl\/|Wget|Go-http-client|node-fetch|axios|okhttp|Java\/|libwww|Scrapy/i, 'script'],
  [/bot\b|crawler|spider|crawl/i, 'bot'],
]

export function botName(ua) {
  if (!ua) return 'no UA'
  for (const [re, name] of BOT_RULES) if (re.test(ua)) return name
  return null
}

function subnetOf(ip) {
  if (!ip || ip === 'server' || ip === '…') return null
  const v4 = /^(?:::ffff:)?(\d+)\.(\d+)\.(\d+)\.\d+$/.exec(ip)
  if (v4) return `${v4[1]}.${v4[2]}.${v4[3]}.0/24`
  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean)
    return parts.length >= 3 ? `${parts.slice(0, 3).join(':')}::/48` : null
  }
  return null
}

function loadUsers(hashes) {
  if (hashes.length === 0) return new Map()
  const db = getDb()
  const byUser = new Map()
  const bySession = new Map()
  const lookup = db.prepare(
    `SELECT sessions.token_hash, users.id, users.username, users.created_at,
       users.telegram_id IS NOT NULL AND users.telegram_notify = 1 AS telegram,
       (SELECT COUNT(*) FROM favorites WHERE favorites.user_id = users.id) AS favorites,
       (SELECT COUNT(*) FROM installs WHERE installs.user_id = users.id) AS installs
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ?`,
  )
  for (const hash of hashes) {
    const row = lookup.get(hash)
    if (!row) continue
    const user = byUser.get(row.id) || {
      id: row.id,
      username: row.username,
      createdAt: row.created_at,
      telegram: Boolean(row.telegram),
      favorites: row.favorites,
      installs: row.installs,
    }
    byUser.set(row.id, user)
    bySession.set(hash, user)
  }
  return bySession
}

function peakOf(minutes) {
  return minutes.reduce((max, minute) => Math.max(max, minute.n), 0)
}

function heavyReasons(load, total) {
  const reasons = []
  if (load.bot) reasons.push('bot')
  if (load.peak >= HEAVY_PEAK_PER_MINUTE) reasons.push('peak')
  if (total >= SHARE_MIN_TOTAL && load.requests / total >= HEAVY_SHARE) reasons.push('share')
  return reasons
}

function browserUa(ua) {
  if (!ua || ua === 'no UA') return false
  if (botName(ua)) return false
  return /Mozilla\/|Chrome\/|Firefox\/|Safari\/|Edg\/|OPR\/|SamsungBrowser/i.test(ua)
}

function decorate(source, total) {
  const bots = [...new Set(source.uas.map(({ ua }) => botName(ua)).filter(Boolean))]
  const bot = source.ip === 'server' || source.ip === '…' ? null : bots[0] || (source.uas.length === 0 ? 'no UA' : null)
  const peak = peakOf(source.minutes)
  const share = total ? source.requests / total : 0
  return { ...source, bot, peak, share, reasons: heavyReasons({ requests: source.requests, peak, bot }, total) }
}

function buildGroups(sources, keyOf, total, { accept = (group) => group.reasons.length > 0, botFromKey = null } = {}) {
  const groups = new Map()
  for (const source of sources) {
    const key = keyOf(source)
    if (!key) continue
    const group = groups.get(key) || { key, ips: new Set(), requests: 0, limited: 0, perMinute: new Map(), bots: new Set() }
    group.ips.add(source.ip)
    group.requests += source.requests
    group.limited += source.limited
    if (source.bot) group.bots.add(source.bot)
    for (const minute of source.minutes) group.perMinute.set(minute.at, (group.perMinute.get(minute.at) || 0) + minute.n)
    groups.set(key, group)
  }
  return [...groups.values()]
    .filter((group) => group.ips.size >= GROUP_MIN_IPS)
    .map((group) => {
      const peak = Math.max(0, ...group.perMinute.values())
      const bot = (botFromKey ? botFromKey(group.key) : [...group.bots][0]) || null
      const load = { requests: group.requests, peak, bot }
      return {
        key: group.key,
        ips: group.ips.size,
        sampleIps: [...group.ips].slice(0, 8),
        requests: group.requests,
        limited: group.limited,
        peak,
        share: total ? group.requests / total : 0,
        bot,
        reasons: heavyReasons(load, total),
        memberIps: [...group.ips],
      }
    })
    .filter(accept)
    .sort((a, b) => b.requests - a.requests)
    .slice(0, GROUPS_LIMIT)
}

export function getModrinthTrafficReport(options = {}) {
  const traffic = getModrinthTraffic(Date.now(), { ...options, sourcesLimit: Infinity })
  const total = traffic.sources.reduce((sum, source) => sum + source.requests, 0)
  const decorated = traffic.sources.map((source) => decorate(source, total))
  const heavyCandidates = decorated.filter((source) => source.reasons.length)
  const real = (source) => source.ip !== 'server' && source.ip !== '…'
  const subnetBuilt = buildGroups(decorated.filter(real), (source) => subnetOf(source.ip), total)
  const agentBuilt = buildGroups(decorated.filter(real), (source) => source.uas[0]?.ua || 'no UA', total, {
    botFromKey: (ua) => (ua === 'no UA' ? 'no UA' : botName(ua)),
    accept: (group) =>
      !browserUa(group.key) &&
      (Boolean(group.bot) || (group.reasons.length > 0 && group.requests / group.ips >= AGENT_MIN_PER_IP)),
  })
  const masked = new Set([...subnetBuilt, ...agentBuilt].flatMap((group) => group.memberIps))
  const othersCandidates = decorated.filter((source) => !source.reasons.length && !masked.has(source.ip))
  const presentGroup = (group) => {
    const rest = { ...group }
    delete rest.memberIps
    return rest
  }

  const heavy = heavyCandidates.slice(0, HEAVY_LIMIT)
  const hashes = [...new Set(heavy.flatMap((source) => source.sessions))]
  let users = new Map()
  try {
    users = loadUsers(hashes)
  } catch {}
  const withUsers = ({ sessions, ...source }) => ({
    ...source,
    users: [...new Map(sessions.map((hash) => users.get(hash)).filter(Boolean).map((user) => [user.id, user])).values()],
    expiredSessions: sessions.filter((hash) => !users.has(hash)).length,
  })

  const othersRequests = othersCandidates.reduce((sum, source) => sum + source.requests, 0)
  const othersLimited = othersCandidates.reduce((sum, source) => sum + source.limited, 0)
  return {
    ...traffic,
    total,
    heavyTotal: heavyCandidates.length,
    thresholds: { peak: HEAVY_PEAK_PER_MINUTE, share: HEAVY_SHARE, shareMinTotal: SHARE_MIN_TOTAL },
    sources: heavy.map(withUsers),
    others: {
      count: othersCandidates.length,
      requests: othersRequests,
      limited: othersLimited,
      share: total ? othersRequests / total : 0,
    },
    subnets: subnetBuilt.map(presentGroup),
    agents: agentBuilt.map(presentGroup),
  }
}
