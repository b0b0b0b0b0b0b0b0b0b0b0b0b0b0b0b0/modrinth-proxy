'use client'

import { useEffect, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useT } from './I18nProvider'

const CHECK_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
const OPEN_DELAY = 350

function codeText(block) {
  return Array.from(block.querySelectorAll('.code-text'), (line) => line.textContent).join('\n')
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {}
    area.remove()
    return ok
  }
}

function copyButtonFrom(target, root) {
  const button = target?.closest?.('[data-code-copy], [data-copy-inline]')
  return button && root?.contains(button) ? button : null
}

function isInline(el) {
  return el.hasAttribute('data-copy-inline')
}

function hasSelectionInside(el) {
  const selection = window.getSelection?.()
  return Boolean(selection && !selection.isCollapsed && el.contains(selection.anchorNode))
}

export default function CodeBlockActions({ children }) {
  const t = useT()
  const ref = useRef(null)
  const activeRef = useRef(null)
  const timerRef = useRef(0)
  const [tip, setTip] = useState(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const label = t('codeBlock.copy')
    root.querySelectorAll('[data-code-copy], [data-copy-inline]').forEach((button) => {
      button.removeAttribute('title')
      if (!isInline(button) && !button.classList.contains('is-copied')) button.setAttribute('aria-label', label)
    })
  }, [t, children])

  useEffect(() => {
    if (!tip) return
    const hide = () => {
      activeRef.current = null
      setTip(null)
    }
    window.addEventListener('scroll', hide, { capture: true, passive: true })
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, { capture: true })
      window.removeEventListener('resize', hide)
    }
  }, [tip])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function labelFor(button) {
    return button.classList.contains('is-copied') ? t('codeBlock.copied') : t('codeBlock.copy')
  }

  function showFor(button, delay) {
    activeRef.current = button
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (activeRef.current !== button || !button.isConnected) return
      const rect = button.getBoundingClientRect()
      setTip({ top: rect.top, left: rect.left, width: rect.width, height: rect.height, label: labelFor(button) })
    }, delay)
  }

  function hideFor(button) {
    if (activeRef.current !== button) return
    activeRef.current = null
    clearTimeout(timerRef.current)
    setTip(null)
  }

  function handleOver(event) {
    const button = copyButtonFrom(event.target, ref.current)
    if (button && activeRef.current !== button) showFor(button, OPEN_DELAY)
  }

  function handleOut(event) {
    const button = copyButtonFrom(event.target, ref.current)
    if (button && !button.contains(event.relatedTarget)) hideFor(button)
  }

  function handleFocus(event) {
    const button = copyButtonFrom(event.target, ref.current)
    if (button && button.matches(':focus-visible')) showFor(button, 0)
  }

  function handleBlur(event) {
    const button = copyButtonFrom(event.target, ref.current)
    if (button) hideFor(button)
  }

  async function copyFrom(button) {
    const inline = isInline(button)
    let text
    if (inline) {
      text = button.textContent
    } else {
      const block = button.closest('.code-block')
      if (!block) return
      text = codeText(block)
    }
    if (!text || !(await writeClipboard(text))) return

    if (!inline) {
      if (!button.dataset.icon) button.dataset.icon = button.innerHTML
      button.innerHTML = CHECK_ICON
    }
    button.classList.add('is-copied')
    if (!inline) button.setAttribute('aria-label', t('codeBlock.copied'))
    showFor(button, 0)
    clearTimeout(Number(button.dataset.timer))
    button.dataset.timer = String(
      setTimeout(() => {
        if (!inline) button.innerHTML = button.dataset.icon
        button.classList.remove('is-copied')
        if (!inline) button.setAttribute('aria-label', t('codeBlock.copy'))
        if (activeRef.current === button) {
          setTip((current) => (current ? { ...current, label: t('codeBlock.copy') } : current))
        }
      }, 1800)
    )
  }

  function handleClick(event) {
    const button = copyButtonFrom(event.target, ref.current)
    if (!button || (isInline(button) && hasSelectionInside(button))) return
    copyFrom(button)
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const button = copyButtonFrom(event.target, ref.current)
    if (!button || !isInline(button)) return
    event.preventDefault()
    copyFrom(button)
  }

  return (
    <div
      ref={ref}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseOver={handleOver}
      onMouseOut={handleOut}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      <Tooltip.Root open={Boolean(tip)}>
        <Tooltip.Trigger asChild>
          <span
            aria-hidden="true"
            className="pointer-events-none fixed"
            style={tip ? { top: tip.top, left: tip.left, width: tip.width, height: tip.height } : { top: 0, left: 0, width: 0, height: 0 }}
          />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" sideOffset={6} className="radix-tooltip-content">
            {tip?.label}
            <Tooltip.Arrow width={11} height={5} className="radix-tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  )
}
