export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { startDownloadTrendCollector } = await import('./lib/downloadTrend')
      startDownloadTrendCollector()
    } catch (error) {
      console.error('Download trend collector failed to start:', error)
    }
  }
}
