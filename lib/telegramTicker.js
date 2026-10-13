const TICK_MS = 30 * 1000
const START_DELAY_MS = 20 * 1000
const TOKEN_RE = /^\d{5,15}:[A-Za-z0-9_-]{30,}$/

export function startTelegramTicker() {
  if (globalThis.__telegramTicker || !TOKEN_RE.test(process.env.TELEGRAM_BOT_TOKEN || '')) return
  globalThis.__internalKey = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')

  const tick = () => {
    const port = process.env.PORT || '3000'
    fetch(`http://127.0.0.1:${port}/api/internal/telegram/tick`, {
      method: 'POST',
      headers: { 'x-internal-key': globalThis.__internalKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(TICK_MS * 3),
    }).catch(() => {})
  }

  const starter = setTimeout(() => {
    tick()
    globalThis.__telegramTicker = setInterval(tick, TICK_MS)
    globalThis.__telegramTicker.unref?.()
  }, START_DELAY_MS)
  starter.unref?.()
  globalThis.__telegramTicker = starter
}
