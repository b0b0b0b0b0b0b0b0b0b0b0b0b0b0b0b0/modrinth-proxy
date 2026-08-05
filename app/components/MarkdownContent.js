import { renderMarkdownToHtml } from '@/lib/renderMarkdown'

export default function MarkdownContent({ content, className }) {
  const html = renderMarkdownToHtml(content)

  return (
    <div
      className={className}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
