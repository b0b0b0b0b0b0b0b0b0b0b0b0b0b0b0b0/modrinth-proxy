export function buildModrinthExtractZipName(title, versionNumber) {
  const cleanTitle = String(title || 'download').trim()
  const cleanVersion = String(versionNumber || 'latest').trim()
  return `${cleanTitle} ${cleanVersion}-EXTRACT_ME.zip`
}

export function sanitizeZipFilename(name) {
  const trimmed = String(name || 'download.zip').trim()
  const safe = trimmed.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 180)
  return safe.endsWith('.zip') ? safe : `${safe}.zip`
}

export async function downloadZipBundle(files, zipName) {
  const res = await fetch('/api/download-zip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, zipName }),
  })
  if (!res.ok) throw new Error('zip failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = zipName
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadFilesSequentially(files, delayMs = 450) {
  for (const file of files) {
    const anchor = document.createElement('a')
    anchor.href = file.url
    anchor.download = file.filename
    anchor.click()
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
}
