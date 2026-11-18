import { renderRichMarkdownToHtml } from '@/lib/renderRichMarkdown'
import { localizeBlockedNotices } from '@/lib/contentFilter'
import { getRequestLocale } from '@/lib/i18n/server'
import CodeBlockActions from './CodeBlockActions'

export default async function RichMarkdownContent({ content, className }) {
  const locale = await getRequestLocale()
  let html = ''
  try {
    html = renderRichMarkdownToHtml(localizeBlockedNotices(content, locale))
  } catch {
    html = ''
  }

  return (
    <CodeBlockActions>
      <div
        className={className}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </CodeBlockActions>
  )
}
