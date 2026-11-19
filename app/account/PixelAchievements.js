'use client'

import Link from 'next/link'
import { useI18n, useMessage } from '../components/I18nProvider'
import { GrumpyKittenFace, KITTEN_WEAR, PixelFace } from '../components/PixelOutfit'
import { KITTEN_GOALS, kittenLevel } from '@/lib/kittenLevels'
import { intlLocale } from '@/lib/i18n/config'
import TypeFilter from './TypeFilter'
import StyledTooltip from '../components/StyledTooltip'
import PixelBadgePicker from './PixelBadgePicker'

const PIXEL_CHAPTERS = [
  { id: 'start', label: 'account.pixelChStart', from: 1, to: 50 },
  { id: 'forest', label: 'account.pixelChForest', from: 51, to: 75 },
  { id: 'sky', label: 'account.pixelChSky', from: 76, to: 100 },
  { id: 'sea', label: 'account.pixelChSea', from: 101, to: 125 },
  { id: 'seasons', label: 'account.pixelChSeasons', from: 126, to: 150 },
  { id: 'magic', label: 'account.pixelChMagic', from: 151, to: 175 },
  { id: 'legend', label: 'account.pixelChLegend', from: 176, to: 200 },
]

const WEAR = Object.entries(KITTEN_WEAR)
  .map(([id, level]) => ({ id, level }))
  .sort((a, b) => a.level - b.level)
const WEAR_BY_LEVEL = new Map(WEAR.map((item) => [item.level, item.id]))

const ICONS = {
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  heart:
    'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  chevron: 'm9 18 6-6-6-6',
}

function Icon({ path, className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d={path} />
    </svg>
  )
}

function Bar({ value, className = 'h-2' }) {
  const width = `${Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10}%`
  return (
    <div className={`overflow-hidden rounded-full bg-(--bg-primary) ${className}`}>
      <div className="h-full rounded-full bg-modrinth-green transition-[width] duration-500" style={{ width }} />
    </div>
  )
}

function usePixelProgress(pets) {
  const { locale, t } = useI18n()
  const list = useMessage('footer.kitten.list')
  const items = KITTEN_GOALS.map((count, index) => ({
    n: index + 1,
    count,
    title: list?.[index]?.title || '',
    text: list?.[index]?.text || '',
  }))
  const level = kittenLevel(pets)
  const previous = level ? KITTEN_GOALS[level - 1] : 0
  const next = items[level] || null
  return {
    t,
    format: (value) => value.toLocaleString(intlLocale(locale)),
    percent: (value) =>
      value > 0 && value < 0.1
        ? `<${(0.1).toLocaleString(intlLocale(locale))}`
        : value.toLocaleString(intlLocale(locale), { maximumFractionDigits: value < 10 ? 1 : 0 }),
    items,
    level,
    current: level ? items[level - 1] : null,
    next,
    step: next ? (pets - previous) / (next.count - previous) : 1,
  }
}

export function PixelAchievementsCard({ pets, grumpy }) {
  const { t, format, items, level, current } = usePixelProgress(pets)
  return (
    <Link
      href="/account?tab=pixel"
      className="group mt-6 flex items-center gap-4 rounded-2xl bg-(--bg-primary) p-4"
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center text-modrinth-green">
        {grumpy ? <GrumpyKittenFace size={56} /> : <PixelFace level={level} size={56} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t('account.pixel')}</span>
        <span className="mt-0.5 block truncate text-base font-bold text-white group-hover:text-modrinth-green">
          {grumpy ? t('footer.kitten.grumpy.title') : current ? current.title : t('account.pixelNoRank')}
        </span>
        {grumpy ? null : (
          <span className="mt-2 flex items-center gap-3">
            <Bar value={level / items.length} className="h-1.5 flex-1" />
            <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-500">
              {t('account.pixelOf', { count: format(level), total: format(items.length) })}
            </span>
          </span>
        )}
      </span>
      <Icon path={ICONS.chevron} className="h-5 w-5 shrink-0 text-gray-500 transition-colors group-hover:text-modrinth-green" />
    </Link>
  )
}

function Stat({ label, value }) {
  return (
    <div className="inline-flex flex-col rounded-2xl bg-(--bg-primary) px-3.5 py-2.5">
      <span className="text-[11px] font-semibold uppercase leading-none tracking-wide text-gray-500">{label}</span>
      <span className="mt-1 text-lg font-extrabold leading-none tabular-nums text-white">{value}</span>
    </div>
  )
}

const TIERS = {
  common: { text: 'text-gray-500', bar: 'bg-gray-500', chip: null },
  rare: { text: 'text-sky-400', bar: 'bg-sky-400', chip: 'bg-sky-400/15 text-sky-400' },
  legendary: { text: 'text-violet-400', bar: 'bg-violet-400', chip: 'bg-violet-400/15 text-violet-400' },
  none: { text: 'text-amber-400', bar: 'bg-amber-400', chip: 'bg-amber-400/15 text-amber-400' },
}
const TIER_LABELS = { rare: 'account.pixelRare', legendary: 'account.pixelLegendary', none: 'account.pixelNobody' }

function rarityOf(rarity, n) {
  if (!Array.isArray(rarity) || !rarity.length) return null
  const share = rarity[n - 1] || 0
  const tier = share === 0 ? 'none' : share < 1 ? 'legendary' : share < 10 ? 'rare' : 'common'
  return { owners: share > 0, share, tier }
}

function RarityMeter({ rare, t, percent }) {
  const style = TIERS[rare.tier]
  const label = percent(rare.share)
  return (
    <StyledTooltip label={t('account.pixelRarityTip', { p: label })}>
      <div className="w-16 shrink-0 text-right sm:w-24">
        <div className={`text-sm font-bold tabular-nums ${style.text}`}>{label}%</div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-(--bg-primary)">
          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${rare.owners ? Math.max(3, rare.share) : 0}%` }} />
        </div>
      </div>
    </StyledTooltip>
  )
}

function AchievementRow({ item, level, isNext, step, wearName, rare, t, format, percent }) {
  const unlocked = item.n <= level
  const tierChip = rare ? TIERS[rare.tier].chip : null
  return (
    <li className={`flex items-center gap-3 py-3 ${isNext ? '-mx-2 rounded-xl bg-[rgba(var(--color-green-rgb),0.06)] px-2' : ''}`}>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          unlocked
            ? 'bg-[rgba(var(--color-green-rgb),0.15)] text-modrinth-green'
            : isNext
              ? 'bg-pink-400/15 text-pink-400'
              : 'bg-(--bg-primary) text-gray-600'
        }`}
      >
        <Icon path={unlocked ? ICONS.trophy : isNext ? ICONS.heart : ICONS.lock} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[11px] font-bold tabular-nums text-gray-600 dark:text-gray-500">#{item.n}</span>
          <span className={`text-sm font-semibold ${unlocked || isNext ? 'text-white' : 'text-gray-500'}`}>{item.title}</span>
          {wearName ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                unlocked ? 'bg-pink-400/15 text-pink-400' : 'bg-(--bg-primary) text-gray-500'
              }`}
            >
              {t('account.pixelOutfitChip', { name: wearName })}
            </span>
          ) : null}
          {tierChip ? (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tierChip}`}>{t(TIER_LABELS[rare.tier])}</span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-500">
          <span className={`mr-1.5 inline-flex items-center gap-1 font-semibold tabular-nums ${unlocked ? 'text-modrinth-green' : ''}`}>
            <Icon path={ICONS.heart} className="h-3 w-3" />
            {format(item.count)}
          </span>
          {unlocked || isNext ? item.text : t('account.pixelSecret')}
        </p>
        {isNext ? <Bar value={step} className="mt-2 h-1.5 max-w-xs" /> : null}
      </div>
      {rare ? <RarityMeter rare={rare} t={t} percent={percent} /> : null}
    </li>
  )
}

function chapterForLevel(level) {
  return (PIXEL_CHAPTERS.find((chapter) => level + 1 <= chapter.to) || PIXEL_CHAPTERS[PIXEL_CHAPTERS.length - 1]).id
}

export default function PixelAchievements({ pets, grumpy, chapter, rarity, username, badgeChoice }) {
  const { t, format, percent, items, level, current, next, step } = usePixelProgress(pets)
  const wearNames = useMessage('footer.kitten.wear') || {}

  if (grumpy) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <span className="text-modrinth-green">
          <GrumpyKittenFace size={96} />
        </span>
        <h2 className="mt-4 text-xl font-extrabold text-white">{t('footer.kitten.grumpy.title')}</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500">{t('footer.kitten.grumpy.text')}</p>
      </div>
    )
  }

  const active = PIXEL_CHAPTERS.find((item) => item.id === chapter) || PIXEL_CHAPTERS.find((item) => item.id === chapterForLevel(level))
  const shown = items.slice(active.from - 1, active.to)
  const wornCount = WEAR.filter((item) => item.level <= level).length
  const chapters = PIXEL_CHAPTERS.map((item) => ({
    id: item.id,
    label: t(item.label),
    count: `${Math.max(0, Math.min(level, item.to) - item.from + 1)}/${item.to - item.from + 1}`,
  }))
  const rarest = items
    .slice(0, level)
    .map((item) => ({ item, rare: rarityOf(rarity, item.n) }))
    .filter((entry) => entry.rare?.owners)
    .reduce((best, entry) => (!best || entry.rare.share < best.rare.share ? entry : best), null)

  return (
    <>
      <div className="flex items-center gap-5 max-[480px]:flex-col max-[480px]:text-center">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl bg-(--bg-primary) text-modrinth-green">
          <PixelFace level={level} size={92} />
        </div>
        <div className="w-full min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t('account.pixelLevel', { n: format(level) })}</div>
          <h2 className="mt-1 text-2xl font-extrabold text-white">{current ? current.title : t('account.pixelNoRank')}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-500">{current ? current.text : t('account.pixelHowTo')}</p>
          <Bar value={step} className="mt-4 h-2" />
          <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-xs text-gray-600 dark:text-gray-500">
            <span className="min-w-0 truncate">{next ? t('account.pixelNext', { title: next.title }) : t('account.pixelDone')}</span>
            {next ? <span className="shrink-0 font-semibold tabular-nums">{t('account.pixelLeft', { count: format(next.count - pets) })}</span> : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Stat label={t('account.pixelPetted')} value={format(pets)} />
        <Stat label={t('account.pixelAchievements')} value={t('account.pixelOf', { count: format(level), total: format(items.length) })} />
        <Stat label={t('account.pixelOutfits')} value={t('account.pixelOf', { count: format(wornCount), total: format(WEAR.length) })} />
      </div>
      {rarest ? (
        <p className="m-0 mt-3 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Icon path={ICONS.trophy} className={`mt-0.5 h-4 w-4 shrink-0 ${TIERS[rarest.rare.tier].text}`} />
          <span>
            {t('account.pixelRarest', { title: rarest.item.title, p: percent(rarest.rare.share) })}
          </span>
        </p>
      ) : null}

      <section className="mt-6" aria-label={t('account.pixelBadgeTitle')}>
        <h3 className="m-0 text-sm font-semibold text-gray-400">{t('account.pixelBadgeTitle')}</h3>
        <PixelBadgePicker username={username} level={level} choice={badgeChoice} pets={pets} />
      </section>

      <section className="mt-6" aria-label={t('account.pixelWardrobe')}>
        <h3 className="m-0 text-sm font-semibold text-gray-400">{t('account.pixelWardrobe')}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {WEAR.map((item) => {
            const worn = item.level <= level
            return (
              <span
                key={item.id}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  worn ? 'bg-pink-400/15 text-pink-400' : 'bg-(--bg-primary) text-gray-600 dark:text-gray-500'
                }`}
              >
                {worn ? null : <Icon path={ICONS.lock} className="h-3 w-3" />}
                {wearNames[item.id] || item.id}
                {worn ? null : <span className="tabular-nums opacity-70">#{item.level}</span>}
              </span>
            )
          })}
        </div>
        <p className="m-0 mt-3 text-xs leading-relaxed text-gray-500">{t('account.pixelWardrobeHint')}</p>
      </section>

      <div className="mt-6">
        <TypeFilter items={chapters} active={active.id} tab="pixel" />
      </div>
      <ul className="divide-y divide-gray-800">
        {shown.map((item) => (
          <AchievementRow
            key={item.n}
            item={item}
            level={level}
            isNext={next?.n === item.n}
            step={step}
            wearName={WEAR_BY_LEVEL.has(item.n) ? wearNames[WEAR_BY_LEVEL.get(item.n)] : null}
            rare={rarityOf(rarity, item.n)}
            t={t}
            format={format}
            percent={percent}
          />
        ))}
      </ul>
    </>
  )
}
