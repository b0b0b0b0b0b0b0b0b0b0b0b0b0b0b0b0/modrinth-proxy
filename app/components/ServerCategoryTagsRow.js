'use client'

import Link from 'next/link'
import * as Popover from '@radix-ui/react-popover'
import { getServerCategoryName } from '@/lib/serverCategories'
import { SERVER_CATEGORY_TAG_CLASS } from '@/lib/serverTagStyles'
import { categoryLabel } from '@/lib/i18n/label'
import { useT } from './I18nProvider'

function CategoryTag({ catId, t }) {
  let name
  try {
    if (!catId || typeof catId !== 'string') return null
    name = categoryLabel(t, catId, getServerCategoryName(catId))
  } catch {
    return null
  }

  return (
    <Link href={`/discover/servers?sc=${catId}`} className={SERVER_CATEGORY_TAG_CLASS}>
      {name}
    </Link>
  )
}

export default function ServerCategoryTagsRow({ categoryIds = [], maxVisible = 3 }) {
  const t = useT()
  const valid = categoryIds.filter((id) => id && typeof id === 'string')
  if (valid.length === 0) return null

  const visible = valid.slice(0, maxVisible)
  const overflow = valid.length > maxVisible ? valid.slice(maxVisible) : []

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((catId) => (
        <CategoryTag key={catId} catId={catId} t={t} />
      ))}
      {overflow.length > 0 && (
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={`${SERVER_CATEGORY_TAG_CLASS} cursor-pointer hover:underline`}
              aria-label={t('server.moreTags', { n: overflow.length })}
            >
              +{overflow.length}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="start"
              sideOffset={6}
              className="z-[100] max-h-[min(320px,50vh)] max-w-[min(320px,calc(100vw-24px))] overflow-y-auto rounded-xl border border-gray-700 p-2 shadow-xl"
              style={{ backgroundColor: 'var(--bg-primary)' }}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex flex-wrap gap-1.5">
                {overflow.map((catId) => (
                  <CategoryTag key={catId} catId={catId} t={t} />
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </div>
  )
}
