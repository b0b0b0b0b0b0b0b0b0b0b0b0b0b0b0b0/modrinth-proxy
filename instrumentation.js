export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { watchModrinthTraffic } = await import('./lib/modrinthTraffic')
    watchModrinthTraffic()
    await import('./lib/courierStore')
    const { knownProjectStamp, noteProjectStamp } = await import('./lib/versionWatch')
    globalThis.__noteProjectStamp = noteProjectStamp
    globalThis.__knownProjectStamp = knownProjectStamp
    const { saveOrganizationCopy, organizationCopy, forgetOrganizationCopy } = await import('./lib/organizationCopies')
    globalThis.__saveOrganizationCopy = saveOrganizationCopy
    globalThis.__organizationCopy = organizationCopy
    globalThis.__forgetOrganizationCopy = forgetOrganizationCopy
    const { noteProjectView, startProjectFreshness } = await import('./lib/projectFreshness')
    globalThis.__noteProjectView = noteProjectView
    startProjectFreshness()
    const { startTelegramTicker } = await import('./lib/telegramTicker')
    startTelegramTicker()
    const { startTelegramWelcome } = await import('./lib/telegramWelcome')
    startTelegramWelcome()
    const { startDiscordGateway } = await import('./lib/discordGateway')
    startDiscordGateway()
  }
}
