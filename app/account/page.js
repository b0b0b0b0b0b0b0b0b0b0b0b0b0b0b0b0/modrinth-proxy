import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getSessionUser } from '@/lib/auth'
import { githubAuthEnabled } from '@/lib/githubAuth'
import { telegramBotId } from '@/lib/telegramAuth'
import {
  buildFavoritesCode,
  getDownloadsPage,
  getFavorites,
  getNotifyMutes,
  getUpdates,
  HISTORY_RETENTION_DAYS,
} from '@/lib/account'
import { getRequestT } from '@/lib/i18n/server'
import { filterAvatar } from '@/lib/contentFilter'
import CatalogPagination from '../components/CatalogPagination'
import RelativeTime from '../components/RelativeTime'
import { ClearFavoritesButton, ClearHistoryButton, RemoveFavoriteButton } from './FavoriteActions'
import FavoritesShare from './FavoritesShare'
import AccountMobileMenu from './AccountMobileMenu'
import AccountSettings from './AccountSettings'
import LogoutButton from './LogoutButton'
import NotifyMuteButton from './NotifyMuteButton'
import SignInMethods from './SignInMethods'
import UsernameEditor from './UsernameEditor'
import MarkSeenButton, { UpdateDownloadLink } from './MarkSeenButton'
import PageFade from './PageFade'

export const dynamic = 'force-dynamic'

const TABS = ['updates', 'favorites', 'downloads', 'signin', 'settings']
const PAGE_SIZE = 20
const TAB_ICONS = {
  updates: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  favorites:
    'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z',
  downloads: 'M12 8v4l3 2M3.05 11a9 9 0 1 1 .5 4M3 4v5h5',
  settings:
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  signin:
    'M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9Z',
}
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
        {meta ? <div className="truncate text-xs text-gray-600 dark:text-gray-500">{meta}</div> : null}
      </div>
      <RelativeTime dateString={new Date(row.created_at).toISOString()} className="shrink-0 text-xs text-gray-600 dark:text-gray-500" />
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
              <span className="text-gray-600 dark:text-gray-500">{t('account.youHave', { v: row.from_version })}</span>
              <svg className="h-3.5 w-3.5 text-gray-600 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
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
          <RelativeTime dateString={new Date(row.created_at).toISOString()} className="text-gray-600 dark:text-gray-500" />
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

function paginate(list, requested) {
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const page = Math.min(pages, Math.max(1, Number.isInteger(requested) ? requested : 1))
  return { rows: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, pages }
}

export default async function AccountPage({ searchParams }) {
  const { t } = getRequestT()
  const user = getSessionUser()

  if (!user) redirect('/login')

  const githubEnabled = githubAuthEnabled()
  const telegramBot = telegramBotId()

  const updates = await getUpdates(user.id)
  const favorites = getFavorites(user.id)
  const requestedPage = parseInt(searchParams?.page, 10)
  const downloads = getDownloadsPage(user.id, requestedPage)
  const updatesPage = paginate(updates, requestedPage)
  const favoritesPage = paginate(favorites, requestedPage)

  const requested = searchParams?.tab
  const tab = TABS.includes(requested) ? requested : updates.length > 0 ? 'updates' : 'favorites'
  const counts = { updates: updates.length, favorites: favorites.length, downloads: downloads.total }
  const mutes = tab === 'downloads' || tab === 'settings' ? getNotifyMutes(user.id) : new Set()
  const trackDownloads = !user.skip_download_updates
  const fadeKey = `${tab}-${tab === 'updates' ? updatesPage.page : tab === 'favorites' ? favoritesPage.page : tab === 'downloads' ? downloads.page : 1}`

  return (
    <div className="mx-auto max-w-7xl pb-8">
      <AccountMobileMenu
        items={TABS.map((value) => ({
          id: value,
          label: t(`account.${value}`),
          icon: TAB_ICONS[value],
          count: value in counts ? counts[value] : null,
          highlight: value === 'updates' && counts.updates > 0,
          active: value === tab,
        }))}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <UsernameEditor username={user.username} />
        <LogoutButton />
      </div>

      <div className="mt-5 flex flex-col gap-6 lg:flex-row">
        <nav aria-label={t('nav.sections')} className="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <div className="sticky top-4 space-y-1 rounded-xl border border-gray-800 bg-modrinth-dark p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-300">{t('nav.sections')}</h2>
            {TABS.map((value) => {
              const active = value === tab
              const highlight = value === 'updates' && counts.updates > 0
              return (
                <Link
                  key={value}
                  href={`/account?tab=${value}`}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-[rgba(var(--color-green-rgb),0.15)] font-semibold text-modrinth-green'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white',
                  ].join(' ')}
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                    <path d={TAB_ICONS[value]} />
                  </svg>
                  <span className="flex-1">{t(`account.${value}`)}</span>
                  {value in counts ? (
                    <span
                      className={[
                        'rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none',
                        active
                          ? 'bg-modrinth-green/20 text-modrinth-green'
                          : highlight
                            ? 'bg-modrinth-green text-black'
                            : 'bg-[var(--bg-tertiary)] text-gray-400',
                      ].join(' ')}
                    >
                      {counts[value]}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </nav>

      <section className="min-w-0 flex-1 rounded-2xl border border-gray-800 bg-modrinth-dark p-4 md:p-5 lg:self-start">
        <PageFade key={fadeKey}>
        {tab === 'updates' ? (
          updates.length > 0 ? (
            <>
              <div className="flex justify-end">
                <MarkSeenButton label={t('account.markAllSeen')} className={GHOST_BUTTON} />
              </div>
              <ul className="divide-y divide-gray-800">
                {updatesPage.rows.map((row) => (
                  <UpdateRow key={`${row.project_id}:${row.variant}`} row={row} t={t} />
                ))}
              </ul>
              <CatalogPagination
                page={updatesPage.page}
                totalPages={updatesPage.pages}
                pathname="/account"
                searchParams={{ tab: 'updates' }}
                className="mt-4 border-t border-gray-800 pt-4"
              />
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-500">{t('account.emptyUpdates')}</p>
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
                  {favoritesPage.rows.map((row) => (
                    <ProjectRow
                      key={row.project_id}
                      row={row}
                      action={<RemoveFavoriteButton projectId={row.project_id} />}
                    />
                  ))}
                </ul>
                <CatalogPagination
                  page={favoritesPage.page}
                  totalPages={favoritesPage.pages}
                  pathname="/account"
                  searchParams={{ tab: 'favorites' }}
                  className="mt-4 border-t border-gray-800 pt-4"
                />
                <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-gray-800 px-4 py-3">
                  <p className="text-xs text-gray-600 dark:text-gray-500">{t('account.clearFavoritesHint')}</p>
                  <ClearFavoritesButton count={favorites.length} />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-500">{t('account.emptyFavorites')}</p>
            )}
          </>
        ) : null}

        {tab === 'signin' ? (
          <SignInMethods
            hasPassword={Boolean(user.has_password)}
            takenProvider={searchParams?.taken || null}
            providers={[
              ...(githubEnabled || user.github_id ? [{ id: 'github', linked: Boolean(user.github_id) }] : []),
              ...(telegramBot || user.telegram_id
                ? [{ id: 'telegram', linked: Boolean(user.telegram_id), botId: telegramBot }]
                : []),
            ]}
          />
        ) : null}

        {tab === 'settings' ? (
          <AccountSettings
            telegram={{ botId: telegramBot, linked: Boolean(user.telegram_id), notify: Boolean(user.telegram_notify) }}
            trackDownloads={trackDownloads}
            recordHistory={Boolean(user.record_history)}
            mutedCount={mutes.size}
            deletion={{
              username: user.username,
              favorites: favorites.length,
              downloads: downloads.total,
              linkedNames: [
                ...(user.github_id ? ['GitHub'] : []),
                ...(user.telegram_id ? ['Telegram'] : []),
              ],
            }}
          />
        ) : null}

        {tab === 'downloads' && !user.record_history ? (
          <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            {t('set.historyOff')}
          </p>
        ) : null}

        {tab === 'downloads' ? (
          downloads.total > 0 ? (
            <>
              <ul className="divide-y divide-gray-800">
                {downloads.rows.map((row) => (
                  <ProjectRow
                    key={row.id}
                    row={row}
                    meta={row.file_name}
                    action={
                      trackDownloads ? (
                        <NotifyMuteButton
                          key={`${row.project_id}:${mutes.has(row.project_id)}`}
                          projectId={row.project_id}
                          muted={mutes.has(row.project_id)}
                        />
                      ) : null
                    }
                  />
                ))}
              </ul>
              <CatalogPagination
                page={downloads.page}
                totalPages={downloads.pages}
                pathname="/account"
                searchParams={{ tab: 'downloads' }}
                className="mt-4 border-t border-gray-800 pt-4"
              />
              <p className="mt-3 text-[11px] text-gray-600 dark:text-gray-500">{t('account.historyNote', { n: HISTORY_RETENTION_DAYS })}</p>
              {trackDownloads ? <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-500">{t('tg.muteHint')}</p> : null}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-gray-800 px-4 py-3">
                <p className="text-xs text-gray-600 dark:text-gray-500">{t('account.clearHistoryHint')}</p>
                <ClearHistoryButton count={downloads.total} />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-500">{t('account.emptyDownloads')}</p>
          )
        ) : null}
        </PageFade>
      </section>
      </div>
    </div>
  )
}
