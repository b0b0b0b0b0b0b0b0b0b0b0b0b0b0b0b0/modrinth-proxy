import Link from 'next/link'
import { OrganizationPresenter } from '@/lib/organizations'
import StyledTooltip from './StyledTooltip'

function BadgeItem({ badge }) {
  const tooltip = `${badge.name}. ${badge.description}`
  const image = (
    <img
      src={badge.icon}
      alt={badge.name}
      className="size-full p-0.5"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  )

  const className = 'flex rounded-2xl'

  if (badge.href) {
    return (
      <StyledTooltip label={tooltip}>
        <a
          href={badge.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {image}
        </a>
      </StyledTooltip>
    )
  }

  return (
    <StyledTooltip label={tooltip}>
      <span className={className}>{image}</span>
    </StyledTooltip>
  )
}

export default function UserSidebar({ organizations = [], badges = [] }) {
  const orgs = organizations.filter((org) => OrganizationPresenter.isPresent(org))

  return (
    <div className="space-y-4">
      {orgs.length > 0 && (
        <div className="rounded-2xl border border-gray-300 dark:border-gray-800 bg-modrinth-dark p-4 pt-3">
          <h2 className="m-0 mb-2 text-lg font-bold text-[var(--text-primary)]">Организации</h2>
          <div className="flex flex-wrap gap-2">
            {orgs.map((org) => {
              const presenter = new OrganizationPresenter(org)
              return (
                <StyledTooltip key={presenter.id} label={presenter.name}>
                  <Link
                    href={presenter.href}
                    className="block rounded-lg transition-transform hover:scale-105"
                  >
                    {presenter.iconUrl ? (
                      <img
                        src={presenter.iconUrl}
                        alt={presenter.name}
                        className="size-12 rounded object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded bg-gradient-to-br from-orange-500/20 to-orange-400/10 text-sm font-bold text-orange-400">
                        {presenter.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                </StyledTooltip>
              )
            })}
          </div>
        </div>
      )}

      {badges.length > 0 && (
        <div className="rounded-2xl border border-gray-300 dark:border-gray-800 bg-modrinth-dark p-4 pt-3">
          <h2 className="m-0 mb-2 text-lg font-bold text-[var(--text-primary)]">Значки</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
            {badges.map((badge) => (
              <BadgeItem key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-300 dark:border-gray-800 bg-modrinth-dark p-4 pt-3">
        <h2 className="m-0 mb-2 text-lg font-bold text-[var(--text-primary)]">Информация</h2>
        <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
          Профиль создан на основе данных Modrinth API
        </p>
      </div>
    </div>
  )
}
