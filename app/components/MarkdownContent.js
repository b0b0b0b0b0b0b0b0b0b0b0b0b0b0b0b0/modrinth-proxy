import { renderMarkdownToHtml } from '@/lib/renderMarkdown'

export default function MarkdownContent({ content, className }) {
  let html = ''
  try {
    html = renderMarkdownToHtml(content)
  } catch {
    html = ''
  }

  return (
    <div
      className={className}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
