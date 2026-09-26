import fs from 'node:fs'
import path from 'node:path'
import { cache } from 'react'
import { GITHUB_REPO_URL } from '@/lib/githubRepo'

export const SITE_LICENSE_ID = 'AGPL-3.0'
export const SITE_LICENSE_NAME = 'GNU Affero General Public License v3.0'
export const SITE_LICENSE_COPYRIGHT = '2025–2026 БоБоБо'

export const SITE_LICENSE_GITHUB_URL = `${GITHUB_REPO_URL}/blob/master/LICENSE`
export const SITE_LICENSE_GNU_URL = 'https://www.gnu.org/licenses/agpl-3.0.html'

export const SITE_LICENSE_SUMMARY = [
  { id: 'allow', tone: 'allow', items: ['fork', 'host', 'share'] },
  { id: 'require', tone: 'require', items: ['open', 'copyright', 'agpl'] },
  { id: 'network', tone: 'network', items: ['saas', 'hidden'] },
]

export const readSiteLicenseText = cache(() => {
  const filePath = path.join(process.cwd(), 'LICENSE')
  return fs.readFileSync(filePath, 'utf8')
})
