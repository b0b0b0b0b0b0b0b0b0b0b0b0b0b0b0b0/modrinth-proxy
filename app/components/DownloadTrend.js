import { sampleAndGetDownloadTrend, startDownloadTrendCollector } from '@/lib/downloadTrend'
import DownloadTrendChart from './DownloadTrendChart'

export default async function DownloadTrend({ resource }) {
  let trend = null
  try {
    startDownloadTrendCollector()
    trend = await sampleAndGetDownloadTrend(resource)
  } catch (error) {
    console.error('Download trend failed:', error)
  }

  if (!trend) return null
  return <DownloadTrendChart trend={trend} />
}
