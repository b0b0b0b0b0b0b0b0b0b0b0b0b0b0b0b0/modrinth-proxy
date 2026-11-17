const ATTR_RE_CACHE = new Map()

function attrRe(name) {
  let re = ATTR_RE_CACHE.get(name)
  if (!re) {
    re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i')
    ATTR_RE_CACHE.set(name, re)
  }
  return re
}

export function tagAttr(tag, name) {
  const match = attrRe(name).exec(tag)
  if (!match) return null
  const value = match[1] ?? match[2]
  if (!value) return null
  const nameEnd = tag.slice(1).search(/[\s/>]/) + 1
  const closeLength = tag.endsWith('/>') ? 2 : 1
  return {
    value,
    before: tag.slice(nameEnd, match.index),
    after: tag.slice(match.index + match[0].length, tag.length - closeLength),
  }
}

export function replaceHtmlImages(content, replacer) {
  return content.replace(/<img\b[^<>]*>/gi, (tag) => {
    const src = tagAttr(tag, 'src')
    return src ? replacer(tag, src.value, src) : tag
  })
}

export function replaceHtmlAnchors(content, replacer) {
  const tokens = /<a\b[^<>]*>|<\/a\s*>/gi
  let out = ''
  let last = 0
  let open = null
  let match
  while ((match = tokens.exec(content))) {
    const token = match[0]
    const isClose = token[1] === '/'
    if (!open) {
      if (isClose) continue
      const href = tagAttr(token, 'href')
      if (href) open = { start: match.index, href, innerStart: match.index + token.length }
      continue
    }
    if (!isClose) continue
    const end = match.index + token.length
    const inner = content.slice(open.innerStart, match.index)
    out += content.slice(last, open.start) + replacer(content.slice(open.start, end), open.href.value, inner, open.href)
    last = end
    open = null
  }
  return out + content.slice(last)
}

export const MD_IMAGE_RE = /!\[([^\]]{0,1024})\]\(([^)]{1,2048})\)/g
export const MD_LINK_RE = /(?<!!)\[([^\]]{1,1024})\]\(([^)]{1,2048})\)/g
export const MD_IMAGE_LINK_RE = /\[!\[([^\]]{0,1024})\]\(([^)]{1,2048})\)\]\(([^)]{1,2048})\)/g
