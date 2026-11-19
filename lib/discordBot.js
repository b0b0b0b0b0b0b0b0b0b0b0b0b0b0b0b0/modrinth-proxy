import { getLoaderDisplayName } from './loaders'
import { translate } from './i18n/translate'
import { SITE_ORIGIN } from './site'

const API = 'https://discord.com/api/v10'
const API_TIMEOUT_MS = 10000
const USER_AGENT = `DiscordBot (${SITE_ORIGIN}, 1.0)`
const DIGEST_LIMIT = 15
const COLOR = 0x1bd96a
const CANNOT_DM = 50007

export function discordBotEnabled() {
  return /^[A-Za-z0-9._-]{50,}$/.test(process.env.DISCORD_BOT_TOKEN || '')
}

async function call(path, body) {
  try {
    const response = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    })
    const data = await response.json().catch(() => null)
    return { ok: response.ok, status: response.status, data: data && typeof data === 'object' ? data : {} }
  } catch {
    return { ok: false, status: 0, data: {} }
  }
}

function outcome(result) {
  if (result.ok) return { ok: true }
  if (result.status === 429) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil(Number(result.data.retry_after) || 30)) }
  }
  if (result.data.code === CANNOT_DM || result.status === 403 || result.status === 404) {
    return { ok: false, blocked: true }
  }
  return { ok: false }
}

export async function sendDiscordDm(discordId, message) {
  const channel = await call('/users/@me/channels', { recipient_id: String(discordId) })
  if (!channel.ok || typeof channel.data.id !== 'string') return outcome(channel)
  return outcome(await call(`/channels/${channel.data.id}/messages`, { ...message, allowed_mentions: { parse: [] } }))
}

function escapeMarkdown(value) {
  return String(value).replace(/([\\*_~`|>#\[\]()-])/g, '\\$1')
}

function linkButton(label, url) {
  return { type: 1, components: [{ type: 2, style: 5, label: label.slice(0, 80), url }] }
}

export function buildDiscordDigest(locale, items) {
  const shown = items.slice(0, DIGEST_LIMIT)
  const lines = shown.map((item) => {
    const link = `${SITE_ORIGIN}/project/${encodeURIComponent(item.slug)}/versions`
    const label = item.version_number || translate(locale, 'account.newRelease')
    const details = item.from_version
      ? translate(locale, 'tg.digestHave', { v: item.from_version })
      : [item.loaders.map(getLoaderDisplayName).join(', '), item.game_version].filter(Boolean).join(' · ')
    return `• [${escapeMarkdown(item.title)}](${link}) — **${escapeMarkdown(label)}**${details ? ` (${escapeMarkdown(details)})` : ''}`
  })
  if (items.length > shown.length) lines.push(escapeMarkdown(translate(locale, 'tg.digestMore', { n: items.length - shown.length })))
  return {
    embeds: [
      {
        title: translate(locale, 'tg.digestTitle'),
        description: lines.join('\n').slice(0, 4000),
        color: COLOR,
        thumbnail: { url: `${SITE_ORIGIN}/icon.png` },
      },
    ],
    components: [linkButton(translate(locale, 'tg.digestOpen'), `${SITE_ORIGIN}/account?tab=updates`)],
  }
}

export function buildDiscordHello(locale) {
  return {
    embeds: [
      {
        title: translate(locale, 'tg.welcomeHi'),
        description: translate(locale, 'dcdm.hello'),
        color: COLOR,
        thumbnail: { url: `${SITE_ORIGIN}/icon.png` },
      },
    ],
    components: [linkButton(translate(locale, 'tg.btnSettings'), `${SITE_ORIGIN}/settings/notifications`)],
  }
}
