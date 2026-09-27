export function isDatapackDownloadContext(contentType, loader) {
  return loader === 'datapack' || contentType === 'datapack' || contentType === 'datapacks'
}

export function isBundledResourcePackFile(file) {
  if (!file) return false
  if (file.file_type === 'required-resource-pack') return true
  if (/resource\s*pack/i.test(file.filename || '')) return true
  return false
}

export function getSupplementaryVersionFiles(files) {
  if (!Array.isArray(files)) return []
  return files.filter((file) => !file.primary)
}

export function getPrimaryVersionFile(files) {
  if (!Array.isArray(files) || files.length === 0) return null
  return files.find((file) => file.primary) || files[0]
}

export function getInstallBundleFiles(files, contentType, loader) {
  const primary = getPrimaryVersionFile(files)
  if (!primary) return []
  if (!isDatapackDownloadContext(contentType, loader)) return [primary]
  const extras = getSupplementaryVersionFiles(files).filter(
    (file) => file.url !== primary.url && file.filename !== primary.filename,
  )
  return [primary, ...extras]
}

export function versionHasBundledResourcePack(files) {
  return getSupplementaryVersionFiles(files).some(isBundledResourcePackFile)
}
