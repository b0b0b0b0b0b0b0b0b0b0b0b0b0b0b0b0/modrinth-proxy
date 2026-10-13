export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTelegramTicker } = await import('./lib/telegramTicker')
    startTelegramTicker()
  }
}
