'use client'

import Link from 'next/link'
import { IconCrown } from '@/lib/icons'
import { TeamMemberPresenter } from '@/lib/teamMembers'
import StyledTooltip from './StyledTooltip'

export default function OrganizationMembersSidebar({ members = [] }) {
  const items = new TeamMemberPresenter(members).sorted()

  if (items.length === 0) return null

  return (
    <div className="bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
      <h3 className="text-base font-bold m-0 mb-3 text-[var(--text-primary)]">Участники</h3>
      <div className="flex flex-col gap-3">
        {items.map((member) => (
          <Link
            key={member.user?.id || member.user?.username}
            href={`/user/${member.user.id}`}
            className="flex items-center gap-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-800 group"
          >
            {member.user.avatar_url ? (
              <img
                src={member.user.avatar_url}
                alt={member.user.username}
                className="size-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-modrinth-green to-modrinth-green-light text-xs font-bold">
                {member.user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="m-0 flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white group-hover:text-modrinth-green transition-colors">
                <span className="truncate">{member.user.username}</span>
                {TeamMemberPresenter.isPrimaryOwner(member) && (
                  <StyledTooltip label="Руководитель организации">
                    <span className="inline-flex shrink-0">
                      <IconCrown className="h-4 w-4 text-orange-400" />
                    </span>
                  </StyledTooltip>
                )}
              </p>
              <p className="m-0 text-xs font-medium text-gray-600 dark:text-gray-400">
                {TeamMemberPresenter.roleLabel(member.role)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
