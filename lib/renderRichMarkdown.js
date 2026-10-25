import { createMarkdownRenderer } from './renderMarkdown'
import rehypeCodeBlocks from './rehypeCodeBlocks'

export const renderRichMarkdownToHtml = createMarkdownRenderer([rehypeCodeBlocks])
