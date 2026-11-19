import { getDb } from './db'
import { isEnabledLocale } from './i18n/config'
import { translate } from './i18n/translate'
import { getLoaderDisplayName } from './loaders'
import { SITE_ORIGIN } from './site'

const API_TIMEOUT_MS = 10000
const DIGEST_LIMIT = 15

function apiBase() {
  return (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/+$/, '')
}

export async function sendTelegramMessage(chatId, text) {
  try {
    const response = await fetch(`${apiBase()}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    })
    const data = await response.json().catch(() => null)
    return data && typeof data === 'object' ? data : { ok: false, error_code: response.status }
  } catch {
    return { ok: false, error_code: 0 }
  }
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function setTelegramNotify(userId, enabled, locale) {
  getDb()
    .prepare(
      `UPDATE users SET telegram_notify = ?, telegram_checked_at = CASE WHEN ? = 1 THEN 0 ELSE telegram_checked_at END,
         locale = COALESCE(?, locale) WHERE id = ?`,
    )
    .run(enabled ? 1 : 0, enabled ? 1 : 0, isEnabledLocale(locale) ? locale : null, userId)
}

const EMOJI = {
  title: { id: '5357382243268471052', char: '📦' },
  item: { id: '5357529448977574440', char: '🔗' },
  open: { id: '5357404048817433932', char: '👤' },
}

function customEmoji(name) {
  const { id, char } = EMOJI[name]
  return `<tg-emoji emoji-id="${id}">${char}</tg-emoji>`
}

export function buildTelegramDigest(locale, items) {
  const shown = items.slice(0, DIGEST_LIMIT)
  const lines = shown.map((item) => {
    const link = `${SITE_ORIGIN}/project/${encodeURIComponent(item.slug)}/versions`
    const label = item.version_number || translate(locale, 'account.newRelease')
    const details = item.from_version
      ? translate(locale, 'tg.digestHave', { v: item.from_version })
      : [item.loaders.map(getLoaderDisplayName).join(', '), item.game_version].filter(Boolean).join(' · ')
    return `${customEmoji('item')} <a href="${link}">${escapeHtml(item.title)}</a> — <b>${escapeHtml(label)}</b>${details ? ` (${escapeHtml(details)})` : ''}`
  })
  if (items.length > shown.length) {
    lines.push(escapeHtml(translate(locale, 'tg.digestMore', { n: items.length - shown.length })))
  }
  return [
    `${customEmoji('title')} <b>${escapeHtml(translate(locale, 'tg.digestTitle'))}</b>`,
    '',
    ...lines,
    '',
    `${customEmoji('open')} <a href="${SITE_ORIGIN}/account?tab=updates">${escapeHtml(translate(locale, 'tg.digestOpen'))}</a>`,
  ].join('\n')
}
