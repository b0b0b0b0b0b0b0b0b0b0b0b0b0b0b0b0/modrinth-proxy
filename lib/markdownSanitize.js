import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { visit, SKIP } from 'unist-util-visit'

const BLOCKED_NOTICE_CLASSES = [
  'blocked-content', 'flex', 'w-fit', 'max-w-2xl', 'mx-auto', 'shrink-0', 'flex-wrap',
  'items-center', 'justify-center', 'gap-3', 'rounded-xl', 'bg-linear-to-br',
  'from-red-500/10', 'to-orange-500/10', 'border', 'border-red-500/20', 'text-sm',
  'text-red-200', 'shadow-lg', 'w-5', 'h-5', 'text-red-300',
]

const IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'streamable.com',
])

export const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...defaultSchema.tagNames, 'center', 'u', 'mark', 'iframe', 'svg', 'path'],
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes.div || []), ['className', ...BLOCKED_NOTICE_CLASSES]],
    span: [...(defaultSchema.attributes.span || []), ['className', ...BLOCKED_NOTICE_CLASSES]],
    svg: [['className', ...BLOCKED_NOTICE_CLASSES], 'viewBox', 'fill', 'ariaHidden'],
    path: ['d'],
    iframe: ['src', 'width', 'height', 'title', 'allowFullScreen', 'frameBorder'],
  },
}

function isAllowedIframe(src) {
  try {
    const url = new URL(String(src))
    return url.protocol === 'https:' && IFRAME_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

function rehypeSafeIframes() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'iframe' || !parent || index === undefined) return
      if (isAllowedIframe(node.properties?.src)) {
        node.properties.sandbox = 'allow-scripts allow-same-origin allow-popups allow-presentation'
        node.properties.referrerPolicy = 'strict-origin-when-cross-origin'
        node.properties.loading = 'lazy'
        node.children = []
        return
      }
      parent.children.splice(index, 1)
      return [SKIP, index]
    })
  }
}

export const safeRehypePlugins = [rehypeRaw, [rehypeSanitize, markdownSanitizeSchema], rehypeSafeIframes]
