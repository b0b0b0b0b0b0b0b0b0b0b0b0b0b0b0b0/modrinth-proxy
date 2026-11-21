import fs from 'fs'
import path from 'path'
import { forgetIdList, readIdList } from './idListFile'

const FILE_NAME = 'grumpy-kittens.json'
const COUNTERS = {
  diamonds: 'diamonds_caught',
  pets: 'kitten_pets',
  ghosts: 'ghosts_caught',
  ornaments: 'ornaments_caught',
  cookies: 'cookies_eaten',
}

function filePath() {
  return path.join(process.cwd(), 'data', FILE_NAME)
}

function inline(value) {
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}: ${inline(item)}`).join(', ')} }`
  }
  return JSON.stringify(value)
}

function readEntries() {
  try {
    const list = JSON.parse(fs.readFileSync(filePath(), 'utf8'))
    return Array.isArray(list) ? list : null
  } catch (error) {
    return error?.code === 'ENOENT' ? [] : null
  }
}

function writeEntries(list) {
  const file = filePath()
  const temp = `${file}.${process.pid}.tmp`
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(temp, `[\n${list.map((entry) => `  ${inline(entry)}`).join(',\n')}\n]\n`, { mode: 0o600 })
  fs.renameSync(temp, file)
  forgetIdList(FILE_NAME)
}

function moscowDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow' }).format(new Date())
}

export function readAutoGrumpy() {
  return (readEntries() ?? []).filter((entry) => entry?.auto)
}

export function makeGrumpy(db, userId, why) {
  const id = Number(userId)
  if (readIdList(FILE_NAME).has(id)) return false
  const list = readEntries()
  if (!list || list.some((entry) => Number(entry?.id) === id)) return false
  const row = db.prepare(`SELECT username, ${Object.values(COUNTERS).join(', ')} FROM users WHERE id = ?`).get(id)
  if (!row) return false
  const was = Object.fromEntries(Object.entries(COUNTERS).map(([kind, column]) => [kind, Number(row[column]) || 0]))
  list.push({ id, name: row.username, why, date: moscowDate(), auto: true, was })
  writeEntries(list)
  db.prepare(`UPDATE users SET ${Object.values(COUNTERS).map((column) => `${column} = 0`).join(', ')} WHERE id = ?`).run(id)
  return true
}
