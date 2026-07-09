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

export function versionHasBundledResourcePack(files) {
  return getSupplementaryVersionFiles(files).some(isBundledResourcePackFile)
}
