import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getDb } from './db'
import { DETECT_FALLBACK_LOCALE, isEnabledLocale } from './i18n/config'
import { localeFromLanguageTag } from './i18n/resolveLocale'
import { translate } from './i18n/translate'
import { SITE_ORIGIN } from './site'

const TOKEN_RE = /^\d{5,15}:[A-Za-z0-9_-]{30,}$/
const POLL_TIMEOUT_S = 50
const REPLY_COOLDOWN_MS = 5000
const MAX_MESSAGE_AGE_S = 60 * 60
const ERROR_PAUSE_MS = 5000
const CONFLICT_PAUSE_MS = 60 * 1000
const MAX_PAUSE_S = 15 * 60
const START_DELAY_MS = 5000
const PHOTO_FILE = path.join(process.cwd(), 'public', 'telegram', 'pixel-welcome.png')

const EMOJI = {
  logo: { id: '5357382243268471052', char: '📦' },
  one: { id: '5361719503107434418', char: '1️⃣' },
  two: { id: '5361716140148040554', char: '2️⃣' },
  bell: { id: '5357354729707969266', char: '🔔' },
  ok: { id: '5357108460578184717', char: '☑️' },
  profile: { id: '5357404048817433932', char: '👤' },
}

function token() {
  const value = process.env.TELEGRAM_BOT_TOKEN || ''
  return TOKEN_RE.test(value) ? value : ''
}

function apiBase() {
  return (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/+$/, '')
}

async function callApi(method, body, timeoutMs) {
  const isForm = body instanceof FormData
  try {
    const response = await fetch(`${apiBase()}/bot${token()}/${method}`, {
      method: 'POST',
      headers: isForm ? undefined : { 'Content-Type': 'application/json' },
      body: isForm ? body : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })
    const data = await response.json().catch(() => null)
    return data && typeof data === 'object' ? data : { ok: false, error_code: response.status }
  } catch {
    return { ok: false, error_code: 0 }
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    timer.unref?.()
  })
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function emoji(name) {
  const { id, char } = EMOJI[name]
  return `<tg-emoji emoji-id="${id}">${char}</tg-emoji>`
}

function text(locale, key) {
  return escapeHtml(translate(locale, `tg.${key}`))
}

function button(locale, key, url, icon) {
  return { text: translate(locale, `tg.${key}`), url, icon_custom_emoji_id: EMOJI[icon].id }
}

function findUser(telegramId) {
  try {
    return getDb().prepare('SELECT locale, telegram_notify FROM users WHERE telegram_id = ?').get(Number(telegramId))
  } catch {
    return null
  }
}

function pickLocale(user, from) {
  if (isEnabledLocale(user?.locale)) return user.locale
  const fromTelegram = localeFromLanguageTag(from?.language_code)
  return isEnabledLocale(fromTelegram) ? fromTelegram : DETECT_FALLBACK_LOCALE
}

export function buildWelcome(locale, state) {
  const lines = [`${emoji('logo')} <b>${text(locale, 'welcomeHi')}</b>`, '', text(locale, 'welcomeAbout'), '']
  if (state === 'ready') {
    lines.push(`${emoji('ok')} ${text(locale, 'welcomeReady')}`)
  } else if (state === 'linked') {
    lines.push(`${emoji('bell')} ${text(locale, 'welcomeAlmost')}`)
  } else {
    lines.push(
      `<b>${text(locale, 'welcomeHow')}</b>`,
      `${emoji('one')} ${text(locale, 'welcomeStep1')}`,
      `${emoji('two')} ${text(locale, 'welcomeStep2')}`,
      '',
      text(locale, 'welcomeEnd'),
    )
  }

  const settings = `${SITE_ORIGIN}/settings/notifications`
  const keyboard = [
    [button(locale, state === 'ready' ? 'btnSettings' : 'btnNotify', settings, 'bell')],
    [button(locale, 'btnSite', SITE_ORIGIN, 'logo'), button(locale, 'btnUpdates', `${SITE_ORIGIN}/account?tab=updates`, 'profile')],
  ]
  return { text: lines.join('\n'), reply_markup: { inline_keyboard: keyboard } }
}

async function sendPhoto(chatId, welcome) {
  const fields = { chat_id: chatId, caption: welcome.text, parse_mode: 'HTML', reply_markup: welcome.reply_markup }
  const cached = globalThis.__telegramWelcomePhoto
  if (cached) {
    const result = await callApi('sendPhoto', { ...fields, photo: cached }, 15000)
    if (result.ok || result.error_code === 429 || result.error_code === 403) return result
    globalThis.__telegramWelcomePhoto = null
  }

  let bytes
  try {
    bytes = await readFile(PHOTO_FILE)
  } catch {
    return { ok: false, error_code: 0 }
  }
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
  form.append('photo', new Blob([bytes], { type: 'image/png' }), 'pixel.png')
  const result = await callApi('sendPhoto', form, 30000)
  const sizes = result.ok ? result.result?.photo : null
  if (Array.isArray(sizes) && sizes.length) globalThis.__telegramWelcomePhoto = sizes[sizes.length - 1].file_id
  return result
}

function lastReplies() {
  if (!globalThis.__telegramWelcomeReplies) globalThis.__telegramWelcomeReplies = new Map()
  return globalThis.__telegramWelcomeReplies
}

function allowReply(chatId, now) {
  const replies = lastReplies()
  if (now - (replies.get(chatId) || 0) < REPLY_COOLDOWN_MS) return false
  replies.set(chatId, now)
  if (replies.size > 5000) {
    for (const [id, at] of replies) if (now - at >= REPLY_COOLDOWN_MS) replies.delete(id)
  }
  return true
}

async function answer(message) {
  const chat = message?.chat
  if (!chat || chat.type !== 'private' || message.from?.is_bot) return
  if (Date.now() / 1000 - (message.date || 0) > MAX_MESSAGE_AGE_S) return
  if (!allowReply(chat.id, Date.now())) return

  const user = findUser(message.from?.id)
  const locale = pickLocale(user, message.from)
  const state = !user ? 'new' : user.telegram_notify ? 'ready' : 'linked'
  const welcome = buildWelcome(locale, state)
  let result = await sendPhoto(chat.id, welcome)
  if (!result.ok && result.error_code !== 429 && result.error_code !== 403) {
    result = await callApi(
      'sendMessage',
      { chat_id: chat.id, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...welcome },
      10000,
    )
  }
  if (result.error_code === 429) {
    await sleep(Math.min(MAX_PAUSE_S, Math.max(1, Number(result.parameters?.retry_after) || 5)) * 1000)
  }
}

async function pollLoop() {
  let offset = 0
  while (token()) {
    const result = await callApi(
      'getUpdates',
      { offset, timeout: POLL_TIMEOUT_S, allowed_updates: ['message'] },
      (POLL_TIMEOUT_S + 10) * 1000,
    )
    if (!result.ok) {
      await sleep(result.error_code === 409 ? CONFLICT_PAUSE_MS : ERROR_PAUSE_MS)
      continue
    }
    for (const update of result.result || []) {
      offset = Math.max(offset, update.update_id + 1)
      await answer(update.message).catch(() => {})
    }
  }
}

export function startTelegramWelcome() {
  if (globalThis.__telegramWelcome || !token()) return
  globalThis.__telegramWelcome = true
  const starter = setTimeout(() => {
    pollLoop().catch(() => {
      globalThis.__telegramWelcome = false
    })
  }, START_DELAY_MS)
  starter.unref?.()
}
