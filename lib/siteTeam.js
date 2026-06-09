const SITE_TEAM_USERNAMES = new Set([
  'b0b0b0',
  'overwritemc',
  'kwilz',
  'chernyash',
])
const SITE_TEAM_USER_IDS = new Set([])

export function getSiteTeamBadge(user) {
  if (!user) return null

  const username = user.username?.toLowerCase()
  const isMember =
    (username && SITE_TEAM_USERNAMES.has(username)) ||
    SITE_TEAM_USER_IDS.has(user.id)

  if (!isMember) return null

  return {
    id: 'site-team',
    icon: '/images/site-team.png',
    name: 'Команда modrinth.black',
    description: 'Разработчик и поддержка этого зеркала Modrinth.',
  }
}
