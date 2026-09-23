export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { getSiteCommits } = await import('./lib/commits')
  try {
    await getSiteCommits()
  } catch {}
}
