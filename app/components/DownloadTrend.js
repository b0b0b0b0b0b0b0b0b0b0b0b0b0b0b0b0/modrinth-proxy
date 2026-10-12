import { sampleAndGetDownloadTrend, startDownloadTrendCollector } from '@/lib/downloadTrend'
import DownloadTrendChart from './DownloadTrendChart'

const MIN_FULL_DAYS = 3

export default async function DownloadTrend({ resource }) {
  let trend = null
  try {
    startDownloadTrendCollector()
    trend = await sampleAndGetDownloadTrend(resource)
  } catch (error) {
    console.error('Download trend failed:', error)
  }

  if (!trend) return null
  const fullDays = trend.days.slice(0, -1).filter((day) => day.value !== null && !day.partial).length
  if (fullDays < MIN_FULL_DAYS) return null
  return <DownloadTrendChart trend={trend} />
}
