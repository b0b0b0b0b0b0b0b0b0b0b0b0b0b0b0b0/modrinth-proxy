import HomeClient from './HomeClient'
import {
  getModrinthPlatformStatistics,
  getModrinthProjectTypeTotals,
} from '@/lib/modrinthCatalogTotals'
import { getRequestT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('home.metaTitle'),
    description: t('home.metaDesc'),
  }
}

export default async function Home() {
  let platformStats = null
  let categoryTotals = null
  try {
    const [stats, totals] = await Promise.all([
      getModrinthPlatformStatistics(),
      getModrinthProjectTypeTotals(),
    ])
    if (stats.projects > 0) platformStats = stats
    if (totals && Object.values(totals).some((n) => n > 0)) categoryTotals = totals
  } catch {
    platformStats = null
    categoryTotals = null
  }
  return (
    <HomeClient
      platformStats={platformStats}
      categoryTotals={categoryTotals}
    />
  )
}
