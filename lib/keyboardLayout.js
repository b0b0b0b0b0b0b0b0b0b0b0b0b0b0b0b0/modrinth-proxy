const EN_TO_RU = {
  '`': 'ё', '~': 'Ё',
  q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш', o: 'щ', p: 'з',
  '[': 'х', '{': 'Х', ']': 'ъ', '}': 'Ъ',
  a: 'ф', s: 'ы', d: 'в', f: 'а', g: 'п', h: 'р', j: 'о', k: 'л', l: 'д',
  ';': 'ж', ':': 'Ж', "'": 'э', '"': 'Э',
  z: 'я', x: 'ч', c: 'с', v: 'м', b: 'и', n: 'т', m: 'ь',
  ',': 'б', '<': 'Б', '.': 'ю', '>': 'Ю', '/': '.', '?': ',',
  Q: 'Й', W: 'Ц', E: 'У', R: 'К', T: 'Е', Y: 'Н', U: 'Г', I: 'Ш', O: 'Щ', P: 'З',
  A: 'Ф', S: 'Ы', D: 'В', F: 'А', G: 'П', H: 'Р', J: 'О', K: 'Л', L: 'Д',
  Z: 'Я', X: 'Ч', C: 'С', V: 'М', B: 'И', N: 'Т', M: 'Ь',
}

const RU_TO_EN = Object.fromEntries(
  Object.entries(EN_TO_RU).map(([en, ru]) => [ru, en])
)

export function convertEnToRuLayout(text) {
  if (!text) return text
  return [...text].map((char) => EN_TO_RU[char] ?? char).join('')
}

export function convertRuToEnLayout(text) {
  if (!text) return text
  return [...text].map((char) => RU_TO_EN[char] ?? char).join('')
}

const CYRILLIC_RE = /[а-яёА-ЯЁ]/
const LATIN_RE = /[a-zA-Z]/

export function suggestLayoutCorrection(query) {
  if (!query || query.length < 3) return null

  const hasCyrillic = CYRILLIC_RE.test(query)
  const hasLatin = LATIN_RE.test(query)

  if (hasCyrillic && hasLatin) return null

  if (hasCyrillic) {
    return convertRuToEnLayout(query)
  }

  if (hasLatin) {
    return convertEnToRuLayout(query)
  }

  return null
}
