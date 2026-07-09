import { zipSync } from 'fflate'
import { MODRINTH_CDN_HOST, MODRINTH_USER_AGENT } from '@/lib/modrinth'
import { sanitizeZipFilename } from '@/lib/downloadZip'

const ALLOWED_HOST = MODRINTH_CDN_HOST

function isAllowedUrl(url) {
  try {
    return new URL(url).hostname === ALLOWED_HOST
  } catch {
    return false
  }
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 })
  }

  const { files, zipName } = body || {}
  if (!Array.isArray(files) || files.length === 0) {
    return Response.json({ error: 'files required' }, { status: 400 })
  }

  for (const file of files) {
    if (!file?.url || !file?.filename || !isAllowedUrl(file.url)) {
      return Response.json({ error: 'invalid file url' }, { status: 400 })
    }
  }

  try {
    const entries = {}
    for (const file of files) {
      const response = await fetch(file.url, {
        headers: { 'User-Agent': MODRINTH_USER_AGENT },
      })
      if (!response.ok) {
        return Response.json({ error: 'fetch failed' }, { status: 502 })
      }
      entries[file.filename] = new Uint8Array(await response.arrayBuffer())
    }

    const zipped = zipSync(entries)
    const safeName = sanitizeZipFilename(zipName)

    return new Response(zipped, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}"`,
      },
    })
  } catch {
    return Response.json({ error: 'zip failed' }, { status: 502 })
  }
}
