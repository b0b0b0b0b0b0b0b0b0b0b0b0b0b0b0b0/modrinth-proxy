'use client'

import * as Tooltip from '@radix-ui/react-tooltip'

export function TooltipProvider({ children }) {
  return (
    <Tooltip.Provider delayDuration={350} skipDelayDuration={120}>
      {children}
    </Tooltip.Provider>
  )
}

export default function StyledTooltip({ children, label, side = 'top', contentClassName = '' }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={7}
          className={['radix-tooltip-content', contentClassName].filter(Boolean).join(' ')}
        >
          {label}
          <Tooltip.Arrow asChild className="radix-tooltip-arrow">
            <svg width="14" height="7" viewBox="0 0 14 7" aria-hidden>
              <path d="M0 0h14L8.6 5.9a2.2 2.2 0 0 1-3.2 0Z" />
            </svg>
          </Tooltip.Arrow>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
