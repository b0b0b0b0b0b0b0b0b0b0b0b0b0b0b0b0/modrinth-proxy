'use client'

import Link from 'next/link'
import { IconCrown } from '@/lib/icons'
import { TeamMemberPresenter } from '@/lib/teamMembers'
import StyledTooltip from './StyledTooltip'

export default function TeamMembersList({ members = [], linkClassName = '' }) {
  const items = new TeamMemberPresenter(members).sorted()

  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      {items.map((member) => (
        <Link
          key={member.user?.id || member.user?.username}
          href={`/user/${member.user.id}`}
          className={`flex items-start gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors group ${linkClassName}`.trim()}
        >
          {member.user.avatar_url ? (
            <img
              src={member.user.avatar_url}
              alt={member.user.username}
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-modrinth-green to-modrinth-green-light rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
              {member.user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-1 text-sm text-gray-900 dark:text-white font-medium group-hover:text-modrinth-green transition-colors">
              <span className="truncate">{member.user.username}</span>
              {TeamMemberPresenter.isPrimaryOwner(member) && (
                <StyledTooltip label="Владелец проекта">
                  <span className="inline-flex shrink-0">
                    <IconCrown className="h-4 w-4 text-orange-400" />
                  </span>
                </StyledTooltip>
              )}
            </p>
            <p className="m-0 text-xs text-gray-600 dark:text-gray-400">
              {TeamMemberPresenter.roleLabel(member.role)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
