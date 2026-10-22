const PREFIX = 'mpfav1'
const ID_RE = /^[A-Za-z0-9]{6,12}$/
const MAX_IDS = 200
const MAX_CODE = 4000
const CODE_FIND_RE = /(?<![A-Za-z0-9])mpfav1((?:\.[A-Za-z0-9]{6,12})+)(?![A-Za-z0-9])/
export const FAVORITES_FILE_MAX = 64 * 1024

export function favoritesFileName(name) {
  const safe = String(name || '').replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 40) || 'list'
  return `modrinth-black-favorites-${safe}.txt`
}

export function buildFavoritesText(t, { name, code, titles = [] }) {
  return [
    t('account.fileTitle', { name }),
    '',
    t('account.fileHowTo'),
    '',
    code,
    '',
    t('account.fileList', { n: titles.length }),
    ...titles.map((title) => `- ${String(title).replace(/[\r\n]+/g, ' ')}`),
    '',
  ].join('\r\n')
}

export function downloadText(fileName, text) {
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function findFavoritesCode(text) {
  if (typeof text !== 'string') return null
  const match = text.match(CODE_FIND_RE)
  if (!match) return null
  const ids = match[1].split('.').slice(1).filter((id) => ID_RE.test(id)).slice(0, MAX_IDS)
  const code = [PREFIX, ...ids].join('.')
  return ids.length > 0 && code.length <= MAX_CODE ? code : null
}

export async function readFavoritesFile(file) {
  if (!file) return { error: 'type' }
  const looksText = !file.type || file.type.startsWith('text/') || /\.txt$/i.test(file.name || '')
  if (!looksText) return { error: 'type' }
  if (file.size > FAVORITES_FILE_MAX) return { error: 'size' }
  let text = ''
  try {
    text = await file.text()
  } catch {
    return { error: 'type' }
  }
  if (text.includes('\u0000')) return { error: 'type' }
  const code = findFavoritesCode(text)
  return code ? { code } : { error: 'code' }
}
