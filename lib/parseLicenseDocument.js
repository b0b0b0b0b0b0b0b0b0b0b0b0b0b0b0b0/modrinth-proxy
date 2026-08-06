const MAJOR_SECTION_RE = /^  (\d+)\. (.+)\.$/
const SUBSECTION_RE = /^    ([a-z])\) (.*)$/
const CENTERED_HEADING_RE = /^ {12,}(\S.*)$/

function flushParagraph(target, paragraph) {
  const text = paragraph?.trim()
  if (text) target.push(text)
}

function isTemplateLine(trimmed) {
  return (
    trimmed.startsWith('<one line') ||
    trimmed.startsWith('Copyright (C) <year>') ||
    trimmed.startsWith('This program is free software:') ||
    trimmed.startsWith('it under the terms of the GNU Affero') ||
    trimmed.startsWith('the Free Software Foundation,') ||
    trimmed.startsWith('(at your option)') ||
    trimmed.startsWith('This program is distributed in the hope') ||
    trimmed.startsWith('but WITHOUT ANY WARRANTY') ||
    trimmed.startsWith('MERCHANTABILITY or FITNESS') ||
    trimmed.startsWith('GNU Affero General Public License for more') ||
    trimmed.startsWith('You should have received a copy of the GNU Affero') ||
    trimmed.startsWith('along with this program.') ||
    trimmed.startsWith('If not, see <https://www.gnu.org/licenses/>')
  )
}

export function parseLicenseDocument(text) {
  const lines = text.split('\n')
  const result = {
    notice: [],
    title: null,
    subtitle: null,
    intro: [],
    preamble: [],
    sections: [],
    howToApply: {
      paragraphs: [],
      template: [],
    },
  }

  let phase = 'notice'
  let licensePart = 'intro'
  let buffer = ''
  let currentSection = null
  let currentSubsection = null
  let inTemplate = false

  const pushBuffer = () => {
    if (!buffer.trim()) {
      buffer = ''
      return
    }

    if (phase === 'notice') {
      flushParagraph(result.notice, buffer)
    } else if (phase === 'howToApply') {
      flushParagraph(result.howToApply.paragraphs, buffer)
    } else if (currentSection) {
      flushParagraph(currentSection.paragraphs, buffer)
    } else if (licensePart === 'intro') {
      flushParagraph(result.intro, buffer)
    } else {
      flushParagraph(result.preamble, buffer)
    }

    buffer = ''
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      if (!inTemplate) {
        pushBuffer()
        currentSubsection = null
      }
      continue
    }

    if (phase === 'notice') {
      if (trimmed.includes('GNU AFFERO GENERAL PUBLIC LICENSE')) {
        pushBuffer()
        result.title = trimmed
        phase = 'license'
        continue
      }
      buffer += (buffer ? ' ' : '') + trimmed
      continue
    }

    if (trimmed === 'END OF TERMS AND CONDITIONS') {
      pushBuffer()
      currentSection = null
      currentSubsection = null
      phase = 'howToApply'
      continue
    }

    if (phase === 'howToApply') {
      if (trimmed.startsWith('How to Apply These Terms')) {
        continue
      }

      if (isTemplateLine(trimmed) || (inTemplate && line.startsWith('    '))) {
        pushBuffer()
        inTemplate = true
        result.howToApply.template.push(trimmed)
        continue
      }

      if (inTemplate) {
        inTemplate = false
      }

      buffer += (buffer ? ' ' : '') + (line.startsWith('  ') ? line.slice(2) : trimmed)
      continue
    }

    const majorMatch = line.match(MAJOR_SECTION_RE)
    if (majorMatch) {
      pushBuffer()
      licensePart = 'terms'
      currentSubsection = null
      currentSection = {
        id: `section-${majorMatch[1]}`,
        number: majorMatch[1],
        title: majorMatch[2],
        paragraphs: [],
        subsections: [],
      }
      result.sections.push(currentSection)
      continue
    }

    const subMatch = line.match(SUBSECTION_RE)
    if (subMatch && currentSection) {
      pushBuffer()
      currentSubsection = { letter: subMatch[1], text: subMatch[2] }
      currentSection.subsections.push(currentSubsection)
      continue
    }

    if (line.startsWith('    ') && currentSubsection) {
      currentSubsection.text += ` ${trimmed}`
      continue
    }

    const centeredMatch = line.match(CENTERED_HEADING_RE)
    if (centeredMatch && !MAJOR_SECTION_RE.test(line)) {
      const heading = centeredMatch[1].trim()
      if (heading === 'Preamble') {
        pushBuffer()
        licensePart = 'preamble'
        continue
      }
      if (heading === 'TERMS AND CONDITIONS') {
        pushBuffer()
        licensePart = 'terms'
        continue
      }
      if (heading.startsWith('Version ')) {
        pushBuffer()
        result.subtitle = heading
        continue
      }
    }

    if (line.startsWith('  ')) {
      if (currentSubsection) currentSubsection = null
      buffer += (buffer ? ' ' : '') + line.slice(2)
      continue
    }

    buffer += (buffer ? ' ' : '') + trimmed
  }

  pushBuffer()

  return result
}

export const LICENSE_URL_RE = /(https?:\/\/[^\s>]+)|(<https?:\/\/[^>]+>)/g

export function splitLicenseLinks(text) {
  const parts = []
  let lastIndex = 0

  for (const match of text.matchAll(LICENSE_URL_RE)) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }

    const raw = match[0]
    const href = raw.startsWith('<') ? raw.slice(1, -1) : raw
    parts.push({ type: 'link', value: href })
    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return parts.length ? parts : [{ type: 'text', value: text }]
}
