import { getUpdates } from './account'
import { getDb } from './db'
import { buildDiscordDigest, buildDiscordHello, discordBotEnabled, sendDiscordDm } from './discordBot'
import { DEFAULT_LOCALE, isEnabledLocale } from './i18n/config'
import { msUntilQuietEnd } from './quietHours'
import { telegramBotId } from './telegramAuth'
import { buildTelegramDigest, sendTelegramMessage } from './telegramBot'
import { unsentUpdates } from './versionWatch'

const CHECK_EVERY_MS = 3 * 60 * 60 * 1000
const USERS_PER_TICK = 5
const SEND_GAP_MS = 1100
const RETRY_MS = 5 * 60 * 1000
const MAX_PAUSE_S = 15 * 60

const TELEGRAM_ON = 'telegram_id IS NOT NULL AND telegram_notify = 1'
const DISCORD_ON = 'discord_id IS NOT NULL AND discord_notify = 1'

export function notifyChannelsSql() {
  const parts = [
    ...(telegramBotId() ? [`(${TELEGRAM_ON})`] : []),
    ...(discordBotEnabled() ? [`(${DISCORD_ON})`] : []),
  ]
  return parts.length ? `(${parts.join(' OR ')})` : '0'
}

function pauses() {
  globalThis.__notifyPausedUntil ||= { telegram: 0, discord: 0 }
  return globalThis.__notifyPausedUntil
}

function pause(channel, seconds) {
  pauses()[channel] = Date.now() + Math.min(MAX_PAUSE_S, Math.max(1, seconds)) * 1000
}

function waitForSendSlot() {
  const now = Date.now()
  const ready = (globalThis.__notifyLastSend || 0) + SEND_GAP_MS
  return ready > now ? new Promise((resolve) => setTimeout(resolve, ready - now)) : Promise.resolve()
}

async function deliverTelegram(db, user, locale, fresh) {
  const result = await sendTelegramMessage(user.telegram_id, buildTelegramDigest(locale, fresh))
  if (result.ok) return 'sent'
  if (result.error_code === 403) {
    db.prepare('UPDATE users SET telegram_notify = 0 WHERE id = ?').run(user.id)
    return 'gone'
  }
  if (result.error_code === 429) {
    pause('telegram', Number(result.parameters?.retry_after) || 30)
    return 'later'
  }
  return 'failed'
}

async function deliverDiscord(db, user, locale, fresh) {
  const result = await sendDiscordDm(user.discord_id, buildDiscordDigest(locale, fresh))
  if (result.ok) return 'sent'
  if (result.blocked) {
    db.prepare('UPDATE users SET discord_notify = 0 WHERE id = ?').run(user.id)
    return 'gone'
  }
  if (result.retryAfter) {
    pause('discord', result.retryAfter)
    return 'later'
  }
  return 'failed'
}

async function notifyNextUser() {
  const db = getDb()
  const now = Date.now()
  if (Object.values(pauses()).some((until) => until > now)) return 'paused'
  const user = db
    .prepare(
      `SELECT id, telegram_id, telegram_notify, discord_id, discord_notify, locale, timezone, quiet_nights, quiet_from, quiet_to
       FROM users WHERE ${notifyChannelsSql()} AND telegram_checked_at < ?
       ORDER BY telegram_checked_at LIMIT 1`,
    )
    .get(now - CHECK_EVERY_MS)
  if (!user) return 'none'
  const sleepMs = user.quiet_nights ? msUntilQuietEnd(user.timezone, user.quiet_from, user.quiet_to, now) : 0
  if (sleepMs > 0) {
    db.prepare('UPDATE users SET telegram_checked_at = ? WHERE id = ?').run(now + sleepMs - CHECK_EVERY_MS, user.id)
    return 'done'
  }
  db.prepare('UPDATE users SET telegram_checked_at = ? WHERE id = ?').run(now, user.id)

  const updates = await getUpdates(user.id, { fromBot: true })
  const fresh = unsentUpdates(db, user.id, updates)
  if (fresh.length === 0) return 'done'

  const locale = isEnabledLocale(user.locale) ? user.locale : DEFAULT_LOCALE
  const outcomes = []
  if (telegramBotId() && user.telegram_id && user.telegram_notify) {
    await waitForSendSlot()
    globalThis.__notifyLastSend = Date.now()
    outcomes.push(await deliverTelegram(db, user, locale, fresh))
  }
  if (discordBotEnabled() && user.discord_id && user.discord_notify) {
    await waitForSendSlot()
    globalThis.__notifyLastSend = Date.now()
    outcomes.push(await deliverDiscord(db, user, locale, fresh))
  }

  if (outcomes.includes('sent')) {
    const remember = db.prepare(
      `INSERT INTO update_notifications (user_id, project_id, variant, version_id) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, project_id, variant) DO UPDATE SET version_id = excluded.version_id`,
    )
    db.transaction(() => {
      for (const item of fresh) remember.run(user.id, item.project_id, item.variant, item.version_id)
    })()
    return 'done'
  }
  if (outcomes.includes('later')) {
    db.prepare('UPDATE users SET telegram_checked_at = 0 WHERE id = ?').run(user.id)
    return 'paused'
  }
  if (outcomes.includes('failed')) {
    db.prepare('UPDATE users SET telegram_checked_at = ? WHERE id = ?').run(now - CHECK_EVERY_MS + RETRY_MS, user.id)
  }
  return 'done'
}

export async function notifyTick() {
  if ((!telegramBotId() && !discordBotEnabled()) || globalThis.__notifyTickBusy) return false
  globalThis.__notifyTickBusy = true
  try {
    for (let i = 0; i < USERS_PER_TICK; i += 1) {
      if ((await notifyNextUser()) !== 'done') break
    }
    return true
  } finally {
    globalThis.__notifyTickBusy = false
  }
}

export async function setDiscordNotify(userId, enabled, locale) {
  const db = getDb()
  if (!enabled) {
    db.prepare('UPDATE users SET discord_notify = 0 WHERE id = ?').run(userId)
    return 'ok'
  }
  const user = db.prepare('SELECT discord_id FROM users WHERE id = ?').get(userId)
  if (!user?.discord_id || !discordBotEnabled()) return 'unlinked'
  const lang = isEnabledLocale(locale) ? locale : DEFAULT_LOCALE
  const result = await sendDiscordDm(user.discord_id, buildDiscordHello(lang))
  if (!result.ok) return result.blocked ? 'blocked' : 'failed'
  db.prepare(
    `UPDATE users SET discord_notify = 1, telegram_checked_at = 0, locale = COALESCE(?, locale) WHERE id = ?`,
  ).run(isEnabledLocale(locale) ? locale : null, userId)
  return 'ok'
}
