import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'

const HTML_CACHE_LIMIT = 200

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function createMarkdownRenderer(rehypePlugins = []) {
  let processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
  for (const plugin of rehypePlugins) processor = processor.use(plugin)
  processor = processor.use(rehypeStringify, { allowDangerousHtml: true })

  const htmlCache = new Map()

  return function render(markdown) {
    if (!markdown || typeof markdown !== 'string') return ''

    const cached = htmlCache.get(markdown)
    if (cached !== undefined) return cached

    let html
    try {
      html = String(processor.processSync(markdown))
    } catch {
      html = `<p>${escapeHtml(markdown)}</p>`
    }

    if (htmlCache.size >= HTML_CACHE_LIMIT) {
      const firstKey = htmlCache.keys().next().value
      htmlCache.delete(firstKey)
    }
    htmlCache.set(markdown, html)
    return html
  }
}

export const renderMarkdownToHtml = createMarkdownRenderer()
