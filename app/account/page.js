import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getSessionUser } from '@/lib/auth'
import { githubAuthEnabled } from '@/lib/githubAuth'
import { buildFavoritesCode, getDownloadsPage, getFavorites, getUpdates, HISTORY_RETENTION_DAYS } from '@/lib/account'
import { getRequestT } from '@/lib/i18n/server'
import { filterAvatar } from '@/lib/contentFilter'
import RelativeTime from '../components/RelativeTime'
import { ClearFavoritesButton, RemoveFavoriteButton } from './FavoriteActions'
import FavoritesShare from './FavoritesShare'
import LogoutButton from './LogoutButton'
import UsernameEditor from './UsernameEditor'
import MarkSeenButton, { UpdateDownloadLink } from './MarkSeenButton'

export const dynamic = 'force-dynamic'

const TABS = ['updates', 'favorites', 'downloads']
const GHOST_BUTTON =
  'shrink-0 rounded-lg border border-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white disabled:opacity-60'
const PRIMARY_BUTTON =
  'inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-modrinth-green px-2.5 py-1 text-xs font-bold text-black transition-opacity hover:opacity-90'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('account.metaTitle'),
    robots: 'noindex, nofollow',
  }
}

function projectHref(row) {
  return row.project_type === 'minecraft_java_server' ? `/server/${row.slug}` : `/project/${row.slug}`
}

function ProjectIcon({ url }) {
  const icon = filterAvatar(url)
  return icon ? (
    <Image src={icon} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg" unoptimized />
  ) : (
    <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-800" />
  )
}

function ProjectRow({ row, meta, action = null }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <ProjectIcon url={row.icon_url} />
      <div className="min-w-0 flex-1">
        <Link href={projectHref(row)} className="block truncate text-sm font-semibold text-white hover:text-modrinth-green">
          {row.title}
        </Link>
        {meta ? <div className="truncate text-xs text-gray-500">{meta}</div> : null}
      </div>
      <RelativeTime dateString={new Date(row.created_at).toISOString()} className="shrink-0 text-xs text-gray-500" />
      {action}
    </li>
  )
}

function Chip({ children }) {
  return (
    <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-[11px] font-semibold text-gray-400">
      {children}
    </span>
  )
}

function UpdateRow({ row, t }) {
  const versionsHref = `${projectHref(row)}/versions`
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <ProjectIcon url={row.icon_url} />
      <div className="min-w-0 flex-1 basis-48">
        <Link href={versionsHref} className="block truncate text-sm font-semibold text-white hover:text-modrinth-green">
          {row.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          {row.from_version ? (
            <>
              <span className="text-gray-500">{t('account.youHave', { v: row.from_version })}</span>
              <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
              <span className="font-bold text-modrinth-green">{row.version_number}</span>
            </>
          ) : (
            <span className="font-bold text-modrinth-green">{t('account.newVersion', { v: row.version_number })}</span>
          )}
          {row.game_version ? <Chip>{row.game_version}</Chip> : null}
          {row.loaders.map((loader) => (
            <Chip key={loader}>{loader}</Chip>
          ))}
          <RelativeTime dateString={new Date(row.created_at).toISOString()} className="text-gray-500" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {row.file ? (
          <UpdateDownloadLink
            href={row.file.url}
            fileName={row.file.filename}
            label={t('account.updateDownload')}
            className={PRIMARY_BUTTON}
          />
        ) : (
          <Link href={versionsHref} className={PRIMARY_BUTTON}>
            {t('account.toVersions')}
          </Link>
        )}
        <MarkSeenButton
          projectId={row.project_id}
          versionId={row.version_id}
          variant={row.variant}
          label={t('account.markSeen')}
          className={GHOST_BUTTON}
        />
      </div>
    </li>
  )
}

function Pager({ page, pages, t }) {
  if (pages <= 1) return null
  const href = (target) => `/account?tab=downloads&page=${target}`
  const linkClass = `${GHOST_BUTTON} px-3 py-1.5`
  const disabledClass = `${linkClass} pointer-events-none opacity-40`
  return (
    <nav className="mt-3 flex items-center justify-between gap-3 border-t border-gray-800 pt-3">
      <Link href={href(page - 1)} aria-disabled={page <= 1} className={page <= 1 ? disabledClass : linkClass}>
        {t('account.pagePrev')}
      </Link>
      <span className="text-xs text-gray-500">{t('account.pageOf', { page, pages })}</span>
      <Link href={href(page + 1)} aria-disabled={page >= pages} className={page >= pages ? disabledClass : linkClass}>
        {t('account.pageNext')}
      </Link>
    </nav>
  )
}

export default async function AccountPage({ searchParams }) {
  const { t } = getRequestT()
  const user = getSessionUser()

  if (!user) redirect('/login')

  const updates = await getUpdates(user.id)
  const favorites = getFavorites(user.id)
  const downloads = getDownloadsPage(user.id, parseInt(searchParams?.page, 10))

  const requested = searchParams?.tab
  const tab = TABS.includes(requested) ? requested : updates.length > 0 ? 'updates' : 'favorites'
  const counts = { updates: updates.length, favorites: favorites.length, downloads: downloads.total }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <UsernameEditor username={user.username} />
        <LogoutButton />
      </div>

      {user.github_id ? (
        <p className="mt-2 text-xs text-gray-500">{t('account.githubLinked')}</p>
      ) : githubAuthEnabled() ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <a href="/api/auth/github?next=/account" className={GHOST_BUTTON}>
            {t('account.githubLink')}
          </a>
          <span className={`text-xs ${searchParams?.github === 'taken' ? 'text-amber-400' : 'text-gray-500'}`}>
            {t(searchParams?.github === 'taken' ? 'account.githubTaken' : 'account.githubLinkHint')}
          </span>
        </div>
      ) : null}

      <div className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-gray-800 bg-modrinth-dark p-1">
        {TABS.map((value) => {
          const active = value === tab
          const highlight = value === 'updates' && counts.updates > 0
          return (
            <Link
              key={value}
              href={`/account?tab=${value}`}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                active ? 'bg-modrinth-green text-black' : 'text-gray-400 hover:text-white',
              ].join(' ')}
            >
              {t(`account.${value}`)}
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none',
                  active
                    ? 'bg-black/20 text-black'
                    : highlight
                      ? 'bg-modrinth-green text-black'
                      : 'bg-[var(--bg-tertiary)] text-gray-400',
                ].join(' ')}
              >
                {counts[value]}
              </span>
            </Link>
          )
        })}
      </div>

      <section className="mt-3 rounded-2xl border border-gray-800 bg-modrinth-dark p-4 md:p-5">
        {tab === 'updates' ? (
          updates.length > 0 ? (
            <>
              <div className="flex justify-end">
                <MarkSeenButton label={t('account.markAllSeen')} className={GHOST_BUTTON} />
              </div>
              <ul className="divide-y divide-gray-800">
                {updates.map((row) => (
                  <UpdateRow key={`${row.project_id}:${row.variant}`} row={row} t={t} />
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-gray-500">{t('account.emptyUpdates')}</p>
          )
        ) : null}

        {tab === 'favorites' ? (
          <>
            <FavoritesShare
              code={buildFavoritesCode(favorites.map((row) => row.project_id))}
              count={favorites.length}
            />
            {favorites.length > 0 ? (
              <>
                <ul className="divide-y divide-gray-800">
                  {favorites.map((row) => (
                    <ProjectRow
                      key={row.project_id}
                      row={row}
                      action={<RemoveFavoriteButton projectId={row.project_id} />}
                    />
                  ))}
                </ul>
                <div className="mt-3 flex justify-end border-t border-gray-800 pt-3">
                  <ClearFavoritesButton count={favorites.length} />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">{t('account.emptyFavorites')}</p>
            )}
          </>
        ) : null}

        {tab === 'downloads' ? (
          downloads.total > 0 ? (
            <>
              <ul className="divide-y divide-gray-800">
                {downloads.rows.map((row) => (
                  <ProjectRow key={row.id} row={row} meta={row.file_name} />
                ))}
              </ul>
              <Pager page={downloads.page} pages={downloads.pages} t={t} />
              <p className="mt-3 text-[11px] text-gray-500">{t('account.historyNote', { n: HISTORY_RETENTION_DAYS })}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">{t('account.emptyDownloads')}</p>
          )
        ) : null}
      </section>
    </div>
  )
}
