export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { watchModrinthTraffic } = await import('./lib/modrinthTraffic')
    watchModrinthTraffic()
    await import('./lib/courierStore')
    const { noteProjectStamp } = await import('./lib/versionWatch')
    globalThis.__noteProjectStamp = noteProjectStamp
    const { startTelegramTicker } = await import('./lib/telegramTicker')
    startTelegramTicker()
  }
}
