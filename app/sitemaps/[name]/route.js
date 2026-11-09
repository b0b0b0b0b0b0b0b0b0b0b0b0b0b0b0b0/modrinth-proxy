import { parseSitemapFile, projectEntries, sectionEntries, urlsetXml, xmlResponse } from '@/lib/sitemap'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { name } = await params
  const file = parseSitemapFile(name)
  if (!file) return new Response('Not found', { status: 404 })
  if (file.pages) return xmlResponse(urlsetXml(sectionEntries()))

  try {
    const entries = await projectEntries(file.type, file.chunk)
    if (!entries) return new Response('Not found', { status: 404 })
    return xmlResponse(urlsetXml(entries))
  } catch {
    return xmlResponse('', 503)
  }
}
