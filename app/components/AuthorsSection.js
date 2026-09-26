'use client'

import Link from 'next/link'
import { IconBuilding2, IconCrown } from '@/lib/icons'
import { OrganizationPresenter } from '@/lib/organizations'
import { TeamMemberPresenter } from '@/lib/teamMembers'
import StyledTooltip from './StyledTooltip'
import { useT } from './I18nProvider'

const ROLE_I18N = {
  Owner: 'author.role.owner',
  'Project Lead': 'author.role.projectLead',
  'Team Lead': 'author.role.teamLead',
  Developer: 'author.role.developer',
  Artist: 'author.role.artist',
  Maintainer: 'author.role.maintainer',
  Member: 'author.role.member',
  Contributor: 'author.role.contributor',
}

function OrganizationRow({ organization, linkClassName = '' }) {
  const t = useT()
  const org = new OrganizationPresenter(organization)
  if (!org.id) return null

  return (
    <Link
      href={org.href}
      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors group ${linkClassName}`.trim()}
    >
      {org.iconUrl ? (
        <img
          src={org.iconUrl}
          alt={org.name}
          className="size-8 shrink-0 rounded object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded border border-orange-400/30 bg-gradient-to-br from-orange-500/20 to-orange-400/10">
          <IconBuilding2 className="h-4 w-4 text-orange-400" />
        </div>
      )}
      <div className="min-w-0">
        <p className="m-0 truncate text-sm text-gray-900 dark:text-white font-medium group-hover:text-modrinth-green transition-colors">
          {org.name}
        </p>
        <p className="m-0 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <IconBuilding2 className="h-3.5 w-3.5 shrink-0" />
          <span>{t('author.role.org')}</span>
        </p>
      </div>
    </Link>
  )
}

function TeamMemberRow({ member, linkClassName = '' }) {
  const t = useT()
  const roleKey = ROLE_I18N[member.role]
  return (
    <Link
      href={`/user/${member.user.id}`}
      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors group ${linkClassName}`.trim()}
    >
      {member.user.avatar_url ? (
        <img
          src={member.user.avatar_url}
          alt={member.user.username}
          className="size-8 shrink-0 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-modrinth-green to-modrinth-green-light text-xs font-bold">
          {member.user.username.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="m-0 flex items-center gap-1 text-sm text-gray-900 dark:text-white font-medium group-hover:text-modrinth-green transition-colors">
          <span className="truncate">{member.user.username}</span>
          {TeamMemberPresenter.isPrimaryOwner(member) && (
            <StyledTooltip label={t('author.role.ownerTip')}>
              <span className="inline-flex shrink-0">
                <IconCrown className="h-4 w-4 text-orange-400" />
              </span>
            </StyledTooltip>
          )}
        </p>
        <p className="m-0 text-xs text-gray-600 dark:text-gray-400">
          {roleKey ? t(roleKey) : TeamMemberPresenter.roleLabel(member.role)}
        </p>
      </div>
    </Link>
  )
}

export default function AuthorsSection({
  organization = null,
  members = [],
  linkClassName = '',
}) {
  const org = new OrganizationPresenter(organization)
  const hasOrganization = OrganizationPresenter.isPresent(organization)
  const items = new TeamMemberPresenter(members).sorted()

  if (!hasOrganization && items.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {hasOrganization && (
        <OrganizationRow organization={organization} linkClassName={linkClassName} />
      )}
      {hasOrganization && items.length > 0 && (
        <hr className="my-0.5 w-full border-0 border-t border-gray-200 dark:border-gray-700/70" />
      )}
      {items.map((member) => (
        <TeamMemberRow
          key={member.user?.id || member.user?.username}
          member={member}
          linkClassName={linkClassName}
        />
      ))}
    </div>
  )
}
