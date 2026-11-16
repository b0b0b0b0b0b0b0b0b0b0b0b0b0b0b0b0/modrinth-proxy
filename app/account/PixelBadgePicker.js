'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMessage, useT } from '../components/I18nProvider'
import { PixelFace } from '../components/PixelOutfit'
import { PixelNameTag } from '../components/PixelBadge'
import { KITTEN_WEAR, PIXEL_BADGE_STAGES, resolvePixelBadge } from '@/lib/kittenLevels'
import { ACCOUNT_UPDATES_KEY } from '../components/AccountUpdatesDot'
import PixelInspect from '../components/PixelInspect'

const STAGE_WEAR = new Map(Object.entries(KITTEN_WEAR).map(([id, level]) => [level, id]))
const EYE_OFF =
  'M10.7 5.1A10 10 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20'

function Option({ selected, disabled, onClick, onInspect, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={
        onInspect
          ? (event) => {
              event.preventDefault()
              onInspect()
            }
          : undefined
      }
      disabled={disabled}
      aria-pressed={selected}
      className={`flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border-2 bg-(--bg-primary) px-2 pb-2 pt-3 text-xs font-semibold transition-colors disabled:opacity-60 ${
        selected ? 'border-modrinth-green text-modrinth-green' : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      <span className="flex h-10 w-10 items-center justify-center text-modrinth-green">{children}</span>
      <span className="w-full truncate text-center">{label}</span>
    </button>
  )
}

export default function PixelBadgePicker({ username, level, choice: initial, pets }) {
  const t = useT()
  const router = useRouter()
  const wearNames = useMessage('footer.kitten.wear') || {}
  const list = useMessage('footer.kitten.list')
  const [inspect, setInspect] = useState(null)
  const [choice, setChoice] = useState(initial ?? null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (level < 1) {
    return <p className="m-0 mt-3 text-xs leading-relaxed text-gray-500">{t('account.pixelBadgeLocked')}</p>
  }

  const pick = async (next) => {
    if (busy || next === choice) return
    const previous = choice
    setChoice(next)
    setBusy(true)
    setFailed(false)
    try {
      const response = await fetch('/api/account/pixel-badge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ choice: next }),
      })
      if (!response.ok) throw new Error('save')
      try {
        sessionStorage.removeItem(ACCOUNT_UPDATES_KEY)
      } catch {}
      router.refresh()
    } catch {
      setChoice(previous)
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const stages = PIXEL_BADGE_STAGES.filter((stage) => stage <= level)
  const stageName = (stage) => (STAGE_WEAR.has(stage) ? wearNames[STAGE_WEAR.get(stage)] : t('account.pixelBadgePlain'))
  const open = (stage, name) =>
    setInspect({ level: stage, title: name, subtitle: t('pixel.inspectFrom', { n: stage, title: list?.[stage - 1]?.title || '' }) })
  const shown = resolvePixelBadge(choice, pets)

  return (
    <>
      <div className="mt-3 inline-flex max-w-full items-center rounded-2xl bg-(--bg-primary) px-3.5 pb-2.5 pt-4">
        <PixelNameTag level={shown} size={20} tooltip={false}>
          <span className="truncate text-base font-bold text-white">{username}</span>
        </PixelNameTag>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <Option selected={choice === null} disabled={busy} onClick={() => pick(null)} onInspect={() => open(level, t('account.pixelBadgeAuto'))} label={t('account.pixelBadgeAuto')}>
          <PixelFace level={level} size={36} />
        </Option>
        {stages.map((stage) => (
          <Option
            key={stage}
            selected={choice === stage}
            disabled={busy}
            onClick={() => pick(stage)}
            onInspect={() => open(stage, stageName(stage))}
            label={stageName(stage)}
          >
            <PixelFace level={stage} size={36} />
          </Option>
        ))}
        <Option selected={choice === 0} disabled={busy} onClick={() => pick(0)} label={t('account.pixelBadgeOff')}>
          <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
            <path d={EYE_OFF} />
          </svg>
        </Option>
      </div>
      <p className={`m-0 mt-2 text-xs leading-relaxed ${failed ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`} role={failed ? 'alert' : undefined}>
        {failed ? t('account.errGeneric') : t('account.pixelBadgeHint')}
      </p>
      <p className="m-0 mt-1 text-xs leading-relaxed text-gray-500">{t('account.pixelInspectTip')}</p>
      {inspect ? <PixelInspect {...inspect} hint={t('pixel.inspectHint')} closeLabel={t('pixel.inspectClose')} onClose={() => setInspect(null)} /> : null}
    </>
  )
}
