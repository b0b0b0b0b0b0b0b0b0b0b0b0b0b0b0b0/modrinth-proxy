import { indexXml, sitemapFiles, xmlResponse } from '@/lib/sitemap'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return xmlResponse(indexXml(await sitemapFiles()))
  } catch {
    return xmlResponse(indexXml(['pages']))
  }
}
