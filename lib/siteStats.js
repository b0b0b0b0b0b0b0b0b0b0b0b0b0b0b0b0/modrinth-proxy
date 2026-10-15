import { getDb } from './db'

const DAY_MS = 24 * 60 * 60 * 1000
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000
const CHART_DAYS = 14
const TOP_FAVORITES = 6

function mskDay(ms) {
  return Math.floor((ms + MSK_OFFSET_MS) / DAY_MS)
}

function countByType(db, table) {
  return db
    .prepare(
      `SELECT projects.project_type AS type, COUNT(*) AS n
       FROM ${table} JOIN projects ON projects.id = ${table}.project_id
       GROUP BY projects.project_type ORDER BY n DESC`,
    )
    .all()
}

export function getSiteStats() {
  const db = getDb()
  const now = Date.now()
  const count = (sql, ...params) => db.prepare(sql).get(...params).n

  const today = mskDay(now)
  const perDay = new Map()
  for (const row of db.prepare('SELECT created_at FROM users').all()) {
    const day = mskDay(row.created_at)
    perDay.set(day, (perDay.get(day) || 0) + 1)
  }
  const days = Array.from({ length: CHART_DAYS }, (_, index) => {
    const day = today - (CHART_DAYS - 1 - index)
    return { date: day * DAY_MS, count: perDay.get(day) || 0 }
  })

  return {
    users: count('SELECT COUNT(*) AS n FROM users'),
    today: perDay.get(today) || 0,
    days,
    active: count('SELECT COUNT(DISTINCT user_id) AS n FROM sessions WHERE created_at > ?', now - DAY_MS),
    github: count('SELECT COUNT(*) AS n FROM users WHERE github_id IS NOT NULL'),
    telegram: count('SELECT COUNT(*) AS n FROM users WHERE telegram_id IS NOT NULL'),
    favorites: count('SELECT COUNT(*) AS n FROM favorites'),
    downloads: count('SELECT COUNT(*) AS n FROM download_history'),
    topFavorites: db
      .prepare(
        `SELECT projects.slug, projects.title, projects.icon_url, projects.project_type AS type, COUNT(*) AS n
         FROM favorites JOIN projects ON projects.id = favorites.project_id
         GROUP BY favorites.project_id HAVING n >= 2
         ORDER BY n DESC, projects.title LIMIT ?`,
      )
      .all(TOP_FAVORITES),
    favoriteTypes: countByType(db, 'favorites'),
    downloadTypes: countByType(db, 'download_history'),
  }
}
