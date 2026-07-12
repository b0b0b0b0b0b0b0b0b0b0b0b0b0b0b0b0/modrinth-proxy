export function pluralRu(n, one, few, many) {
  const abs = Math.abs(Math.trunc(n))
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export function removedVerbRu(n) {
  const abs = Math.abs(Math.trunc(n))
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 === 1 && mod100 !== 11) return 'удалён'
  return 'удалено'
}

export function catalogBlockedRemovedPhrase(count) {
  const n = Math.trunc(count)
  return `${removedVerbRu(n)} ${n.toLocaleString('ru-RU')} ${pluralRu(n, 'ресурс', 'ресурса', 'ресурсов')}`
}
