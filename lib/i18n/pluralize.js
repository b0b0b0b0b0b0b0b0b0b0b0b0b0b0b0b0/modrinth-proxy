export function pluralize(count, locale, one, few, many) {
  const n = Number(count) || 0
  if (locale === 'ru' || locale === 'pl') {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod100 >= 11 && mod100 <= 19) return many
    if (mod10 === 1) return one
    if (mod10 >= 2 && mod10 <= 4) return few
    return many
  }
  return n === 1 ? one : many
}
