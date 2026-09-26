import { formatDownloads } from '@/lib/modrinth'
import { getRequestT } from '@/lib/i18n/server'
import { pluralCount } from '@/lib/i18n/label'

function formatJoinDate(dateString, t, locale) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  const diffInYears = Math.floor(diffInDays / 365.25)
  const diffInMonths = Math.floor(diffInDays / 30.44)

  if (diffInYears >= 1) {
    const unit = pluralCount(locale, diffInYears, t('author.yOne'), t('author.yFew'), t('author.yMany'))
    return t('author.ago', { n: diffInYears, unit })
  }
  if (diffInMonths < 1) return t('author.thisMonth')
  if (diffInMonths === 1) return t('author.monthAgo')
  const unit = pluralCount(locale, diffInMonths, t('author.mOne'), t('author.mFew'), t('author.mMany'))
  return t('author.ago', { n: diffInMonths, unit })
}

function getRoleBadgeStyle(role) {
  const styles = {
    admin: 'bg-red-500/20 text-red-400 border border-red-500/30',
    moderator: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    developer: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    user: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  }
  return styles[role] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
}

export default function UserProfileHeader({ author, stats }) {
  const { t, locale } = getRequestT()
  const projectsWord = pluralCount(locale, stats.projectCount, t('author.pOne'), t('author.pFew'), t('author.pMany'))
  return (
    <div className="p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex flex-col gap-4 user-info-container">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @media (min-width: 284px) {
                  .user-info-container {
                    flex-direction: row !important;
                  }
                }
              `,
            }}
          />
          {author.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.username}
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-modrinth-green to-modrinth-green-light rounded-lg flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {author.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{author.username}</h1>
              {author.role && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${getRoleBadgeStyle(author.role)}`}>
                  {t(`author.role.${author.role}`) || author.role}
                </span>
              )}
            </div>
            {author.bio && <p className="text-gray-300 max-w-2xl">{author.bio}</p>}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <path d="M3.29 7 12 12l8.71-5M12 22V12" />
                </svg>
                <span className="font-semibold text-white">{stats.projectCount}</span>
                <span>{projectsWord}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
                </svg>
                <span className="font-semibold text-white">{formatDownloads(stats.totalDownloads)}</span>
                <span>{t('author.downloads')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2" />
                </svg>
                <span className="hidden sm:inline">{t('author.joined')}</span>
                <span>{formatJoinDate(author.created, t, locale)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
