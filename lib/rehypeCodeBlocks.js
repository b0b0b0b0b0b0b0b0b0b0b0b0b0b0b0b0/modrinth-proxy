import { common, createLowlight } from 'lowlight'
import groovy from 'highlight.js/lib/languages/groovy'
import properties from 'highlight.js/lib/languages/properties'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import { toText } from 'hast-util-to-text'
import { visit } from 'unist-util-visit'

const lowlight = createLowlight(common)
lowlight.register({ groovy, properties, dockerfile })
lowlight.registerAlias({ groovy: ['gradle'], ini: ['toml', 'cfg', 'conf'], bash: ['sh', 'zsh', 'console', 'shell'] })

const LANG_LABELS = {
  yml: 'YAML',
  yaml: 'YAML',
  json: 'JSON',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  java: 'Java',
  kotlin: 'Kotlin',
  kt: 'Kotlin',
  groovy: 'Groovy',
  gradle: 'Gradle',
  properties: 'Properties',
  toml: 'TOML',
  ini: 'INI',
  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  sh: 'Bash',
  bash: 'Bash',
  shell: 'Shell',
  console: 'Console',
  python: 'Python',
  py: 'Python',
  sql: 'SQL',
  dockerfile: 'Dockerfile',
}

const COPY_ICON = {
  type: 'element',
  tagName: 'svg',
  properties: { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', ariaHidden: 'true' },
  children: [
    { type: 'element', tagName: 'rect', properties: { x: 9, y: 9, width: 13, height: 13, rx: 2 }, children: [] },
    { type: 'element', tagName: 'path', properties: { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }, children: [] },
  ],
}

function detectLanguage(code) {
  const classes = code.properties?.className || []
  for (const cls of classes) {
    const match = /^lang(?:uage)?-([\w+#.-]+)$/i.exec(String(cls))
    if (match) return match[1].toLowerCase()
  }
  return null
}

function flatten(nodes, classes, out) {
  for (const node of nodes) {
    if (node.type === 'text') out.push({ value: node.value, classes })
    else if (node.type === 'element') flatten(node.children || [], [...classes, ...(node.properties?.className || [])], out)
  }
  return out
}

function splitLines(nodes) {
  const lines = [[]]
  for (const seg of flatten(nodes, [], [])) {
    const parts = seg.value.split('\n')
    parts.forEach((part, i) => {
      if (i > 0) lines.push([])
      if (!part) return
      const text = { type: 'text', value: part }
      lines[lines.length - 1].push(
        seg.classes.length ? { type: 'element', tagName: 'span', properties: { className: seg.classes }, children: [text] } : text
      )
    })
  }
  if (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop()
  return lines
}

function highlight(source, lang) {
  if (lang && lowlight.registered(lang)) {
    try {
      return lowlight.highlight(lang, source).children
    } catch {}
  }
  return [{ type: 'text', value: source }]
}

export default function rehypeCodeBlocks() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'code' && parent?.tagName !== 'pre') {
        node.properties = { ...node.properties, className: [...(node.properties?.className || []), 'code-inline'], tabIndex: 0, dataCopyInline: '' }
        return
      }
      if (node.tagName !== 'pre' || !parent || index == null) return
      const code = node.children?.find((child) => child.type === 'element' && child.tagName === 'code')
      if (!code) return

      const lang = detectLanguage(code)
      const known = lang && lowlight.registered(lang)
      const lines = splitLines(highlight(toText(code, { whitespace: 'pre' }), lang))
      const digits = String(lines.length).length

      const head = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block-head'] },
        children: [
          { type: 'element', tagName: 'span', properties: { className: ['code-block-lang'] }, children: [{ type: 'text', value: LANG_LABELS[lang] || lang || 'text' }] },
          { type: 'element', tagName: 'button', properties: { type: 'button', className: ['code-block-copy'], dataCodeCopy: '' }, children: [COPY_ICON] },
        ],
      }

      const body = {
        type: 'element',
        tagName: 'pre',
        properties: { className: ['code-block-pre'] },
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: { className: ['hljs', ...(known ? [`language-${lang}`] : [])], style: `--ln-digits:${digits}` },
            children: lines.map((line) => ({
              type: 'element',
              tagName: 'span',
              properties: { className: ['code-line'] },
              children: [{ type: 'element', tagName: 'span', properties: { className: ['code-text'] }, children: line }],
            })),
          },
        ],
      }

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block'], dataLang: lang || 'text' },
        children: [head, body],
      }
      return 'skip'
    })
  }
}
