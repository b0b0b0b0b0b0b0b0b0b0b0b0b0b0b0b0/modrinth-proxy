import { parseGitHubRepoFromSourceUrl } from '@/lib/github'

function ExternalIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
    </svg>
  )
}

function translateDonationPlatform(platform) {
  const platforms = {
    Other: 'Донат',
    Patreon: 'Patreon',
    'Ko-fi': 'Ko-fi',
    PayPal: 'PayPal',
    'Open Collective': 'Open Collective',
    'GitHub Sponsors': 'GitHub Sponsors',
    'Buy Me a Coffee': 'Buy Me a Coffee',
  }
  return platforms[platform] || 'Донат'
}

export default function ProjectLinksCard({ resource, includeSource = false }) {
  const hasGitHubSource = Boolean(parseGitHubRepoFromSourceUrl(resource?.source_url))
  const showSource = includeSource
    ? Boolean(resource?.source_url)
    : Boolean(resource?.source_url && !hasGitHubSource)

  const hasDonations = Array.isArray(resource?.donation_urls) && resource.donation_urls.length > 0
  const hasLinks = Boolean(
    resource?.discord_url ||
      showSource ||
      resource?.wiki_url ||
      resource?.issues_url ||
      hasDonations
  )

  if (!hasLinks) return null

  return (
    <div className="bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-2xl p-4">
      <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Ссылки
      </h3>
      <div className="space-y-2">
        {resource.issues_url && (
          <a href={resource.issues_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-red-400 transition-colors group">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="group-hover:underline">Сообщить о проблеме</span>
            <ExternalIcon />
          </a>
        )}
        {showSource && (
          <a href={resource.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-purple-400 transition-colors group">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6l-6 6 6 6M16 18l6-6-6-6" />
            </svg>
            <span className="group-hover:underline">Исходный код</span>
            <ExternalIcon />
          </a>
        )}
        {resource.wiki_url && (
          <a href={resource.wiki_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-orange-400 transition-colors group">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="group-hover:underline">Wiki</span>
            <ExternalIcon />
          </a>
        )}
        {resource.discord_url && (
          <a href={resource.discord_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-blue-400 transition-colors group">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span className="group-hover:underline">Вступить в Discord</span>
            <ExternalIcon />
          </a>
        )}

        {hasDonations && (
          <>
            <hr className="border-gray-300 dark:border-gray-700 my-2" />
            {resource.donation_urls.map((donation, idx) => (
              <a key={idx} href={donation.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-modrinth-green-light transition-colors group">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                <span className="group-hover:underline">{translateDonationPlatform(donation.platform)}</span>
                <ExternalIcon />
              </a>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
