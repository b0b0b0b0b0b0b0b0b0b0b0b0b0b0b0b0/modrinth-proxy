import { renderRichMarkdownToHtml } from '@/lib/renderRichMarkdown'
import CodeBlockActions from './CodeBlockActions'

export default function RichMarkdownContent({ content, className }) {
  let html = ''
  try {
    html = renderRichMarkdownToHtml(content)
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
