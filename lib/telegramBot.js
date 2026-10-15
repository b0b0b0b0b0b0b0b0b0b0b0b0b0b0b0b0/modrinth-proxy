import { getUpdates } from './account'
import { getDb } from './db'
import { DEFAULT_LOCALE, isEnabledLocale } from './i18n/config'
import { translate } from './i18n/translate'
import { getLoaderDisplayName } from './loaders'
import { SITE_ORIGIN } from './site'
import { telegramBotId } from './telegramAuth'
import { unsentUpdates } from './versionWatch'

const CHECK_EVERY_MS = 3 * 60 * 60 * 1000
const API_TIMEOUT_MS = 10000
const DIGEST_LIMIT = 15
const USERS_PER_TICK = 5
const SEND_GAP_MS = 1100
const RETRY_MS = 5 * 60 * 1000
const MAX_PAUSE_S = 15 * 60

function apiBase() {
  return (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/+$/, '')
}

async function sendMessage(chatId, text) {
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

function buildDigest(locale, items) {
  const shown = items.slice(0, DIGEST_LIMIT)
  const lines = shown.map((item) => {
    const link = `${SITE_ORIGIN}/project/${encodeURIComponent(item.slug)}/versions`
    const label = item.version_number || translate(locale, 'account.newRelease')
    const details = item.from_version
      ? translate(locale, 'tg.digestHave', { v: item.from_version })
      : [item.loaders.map(getLoaderDisplayName).join(', '), item.game_version].filter(Boolean).join(' · ')
    return `• <a href="${link}">${escapeHtml(item.title)}</a> — <b>${escapeHtml(label)}</b>${details ? ` (${escapeHtml(details)})` : ''}`
  })
  if (items.length > shown.length) {
    lines.push(escapeHtml(translate(locale, 'tg.digestMore', { n: items.length - shown.length })))
  }
  return [
    `🔔 <b>${escapeHtml(translate(locale, 'tg.digestTitle'))}</b>`,
    '',
    ...lines,
    '',
    `<a href="${SITE_ORIGIN}/account?tab=updates">${escapeHtml(translate(locale, 'tg.digestOpen'))}</a>`,
  ].join('\n')
}

function waitForSendSlot() {
  const now = Date.now()
  const ready = Math.max(globalThis.__telegramPausedUntil || 0, (globalThis.__telegramLastSend || 0) + SEND_GAP_MS)
  return ready > now ? new Promise((resolve) => setTimeout(resolve, ready - now)) : Promise.resolve()
}

async function notifyNextUser() {
  const db = getDb()
  const now = Date.now()
  if ((globalThis.__telegramPausedUntil || 0) > now) return 'paused'
  const user = db
    .prepare(
      `SELECT id, telegram_id, locale FROM users
       WHERE telegram_id IS NOT NULL AND telegram_notify = 1 AND telegram_checked_at < ?
       ORDER BY telegram_checked_at LIMIT 1`,
    )
    .get(now - CHECK_EVERY_MS)
  if (!user) return 'none'
  db.prepare('UPDATE users SET telegram_checked_at = ? WHERE id = ?').run(now, user.id)

  const updates = await getUpdates(user.id, { fromBot: true })
  const fresh = unsentUpdates(db, user.id, updates)
  if (fresh.length === 0) return 'done'

  const locale = isEnabledLocale(user.locale) ? user.locale : DEFAULT_LOCALE
  await waitForSendSlot()
  globalThis.__telegramLastSend = Date.now()
  const result = await sendMessage(user.telegram_id, buildDigest(locale, fresh))

  if (result.ok) {
    const remember = db.prepare(
      `INSERT INTO update_notifications (user_id, project_id, variant, version_id) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, project_id, variant) DO UPDATE SET version_id = excluded.version_id`,
    )
    db.transaction(() => {
      for (const item of fresh) remember.run(user.id, item.project_id, item.variant, item.version_id)
    })()
    return 'done'
  }
  if (result.error_code === 403) {
    db.prepare('UPDATE users SET telegram_notify = 0 WHERE id = ?').run(user.id)
    return 'done'
  }
  if (result.error_code === 429) {
    const retryAfter = Math.min(MAX_PAUSE_S, Math.max(1, Number(result.parameters?.retry_after) || 30))
    globalThis.__telegramPausedUntil = Date.now() + retryAfter * 1000
    db.prepare('UPDATE users SET telegram_checked_at = 0 WHERE id = ?').run(user.id)
    return 'paused'
  }
  db.prepare('UPDATE users SET telegram_checked_at = ? WHERE id = ?').run(now - CHECK_EVERY_MS + RETRY_MS, user.id)
  return 'done'
}

export async function telegramTick() {
  if (!telegramBotId() || globalThis.__telegramTickBusy) return false
  globalThis.__telegramTickBusy = true
  try {
    for (let i = 0; i < USERS_PER_TICK; i += 1) {
      if ((await notifyNextUser()) !== 'done') break
    }
    return true
  } finally {
    globalThis.__telegramTickBusy = false
  }
}
