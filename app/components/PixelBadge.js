'use client'

import { PixelFace } from './PixelOutfit'
import StyledTooltip from './StyledTooltip'
import { useMessage, useT } from './I18nProvider'

export default function PixelBadge({ level, size = 20, tooltip = true, className = '', style }) {
  const t = useT()
  const list = useMessage('footer.kitten.list')
  if (!level) return null
  const label = t('pixel.badge', { title: list?.[level - 1]?.title || '' })
  const badge = (
    <span
      role="img"
      aria-label={label}
      className={`fk-badge inline-flex shrink-0 items-center justify-center text-modrinth-green ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <PixelFace level={level} size={size} />
    </span>
  )
  return tooltip ? <StyledTooltip label={label}>{badge}</StyledTooltip> : badge
}

export function PixelNameTag({ level, size = 20, tooltip = true, className = '', children }) {
  return (
    <span className={`relative inline-flex min-w-0 max-w-full ${className}`} style={level ? { marginRight: Math.round(size * 0.3) } : undefined}>
      {children}
      {level ? (
        <PixelBadge
          level={level}
          size={size}
          tooltip={tooltip}
          className="absolute rotate-12"
          style={{ top: -Math.round(size * 0.5), right: -Math.round(size * 0.4) }}
        />
      ) : null}
    </span>
  )
}
