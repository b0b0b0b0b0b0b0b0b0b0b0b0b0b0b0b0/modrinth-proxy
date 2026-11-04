'use client'

import { useEffect, useRef, useState } from 'react'
import { DAY_MINUTES, QUIET_STEP, isValidQuietWindow, quietLength } from '@/lib/quietHours'

const ORIGIN = 14 * 60 + 30
const TICKS = [18, 0, 6, 12]
const KEY_STEPS = { ArrowLeft: -QUIET_STEP, ArrowDown: -QUIET_STEP, ArrowRight: QUIET_STEP, ArrowUp: QUIET_STEP, PageDown: -60, PageUp: 60 }

function wrap(minutes) {
  return ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
}

function shift(minutes) {
  return wrap(minutes - ORIGIN)
}

function segments(from, to) {
  const start = shift(from)
  const length = quietLength(from, to)
  if (start + length <= DAY_MINUTES) return [[start, length]]
  return [
    [start, DAY_MINUTES - start],
    [0, start + length - DAY_MINUTES],
  ]
}

function circularDistance(a, b) {
  const diff = Math.abs(a - b) % DAY_MINUTES
  return Math.min(diff, DAY_MINUTES - diff)
}

function percent(minutes, edge) {
  const position = shift(minutes)
  return `${((position === 0 && edge ? DAY_MINUTES : position) / DAY_MINUTES) * 100}%`
}

export default function QuietDayBar({ from, to, active, disabled, labels, formatTime, onChange, onCommit }) {
  const trackRef = useRef(null)
  const dragRef = useRef(null)
  const latestRef = useRef({ from, to })
  const keyTimerRef = useRef(0)
  const [dragging, setDragging] = useState(null)

  latestRef.current = { from, to }

  useEffect(() => () => window.clearTimeout(keyTimerRef.current), [])

  const minuteAt = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return wrap(Math.round((ratio * DAY_MINUTES) / QUIET_STEP) * QUIET_STEP + ORIGIN)
  }

  const move = (handle, minutes) => {
    const current = latestRef.current
    const next = handle === 'from' ? { from: minutes, to: current.to } : { from: current.from, to: minutes }
    if ((next.from === current.from && next.to === current.to) || !isValidQuietWindow(next.from, next.to)) return
    latestRef.current = next
    onChange(next)
  }

  const startDrag = (event, handle) => {
    if (disabled || event.button > 0) return
    event.preventDefault()
    trackRef.current.setPointerCapture(event.pointerId)
    dragRef.current = handle
    setDragging(handle)
    move(handle, minuteAt(event.clientX))
  }

  const onTrackDown = (event) => {
    if (disabled || event.button > 0) return
    const minutes = minuteAt(event.clientX)
    const handle = event.target.dataset.handle || (circularDistance(minutes, from) <= circularDistance(minutes, to) ? 'from' : 'to')
    startDrag(event, handle)
  }

  const onPointerMove = (event) => {
    if (dragRef.current) move(dragRef.current, minuteAt(event.clientX))
  }

  const finishDrag = () => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(null)
    onCommit(latestRef.current)
  }

  const onKeyDown = (event, handle) => {
    const step = KEY_STEPS[event.key]
    if (!step || disabled) return
    event.preventDefault()
    move(handle, wrap(latestRef.current[handle] + step))
    window.clearTimeout(keyTimerRef.current)
    keyTimerRef.current = window.setTimeout(() => onCommit(latestRef.current), 700)
  }

  const handles = [
    { id: 'from', value: from, edge: false },
    { id: 'to', value: to, edge: true },
  ]

  return (
    <div className={`mt-3 select-none ${disabled ? 'pointer-events-none opacity-70' : ''}`}>
      <div
        ref={trackRef}
        onPointerDown={onTrackDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={finishDrag}
        className="relative h-6 cursor-pointer touch-none"
      >
        <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-gray-700/60">
          {segments(from, to).map(([start, length]) => (
            <div
              key={start}
              className={`absolute inset-y-0 ${dragging ? '' : 'transition-all duration-200'} ${active ? 'bg-modrinth-green/70' : 'bg-gray-500/60'}`}
              style={{ left: `${(start / DAY_MINUTES) * 100}%`, width: `${(length / DAY_MINUTES) * 100}%` }}
            />
          ))}
        </div>
        {handles.map((handle) => (
          <div
            key={handle.id}
            data-handle={handle.id}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={labels[handle.id]}
            aria-valuemin={0}
            aria-valuemax={DAY_MINUTES - QUIET_STEP}
            aria-valuenow={handle.value}
            aria-valuetext={formatTime(handle.value)}
            onKeyDown={(event) => onKeyDown(event, handle.id)}
            className={`absolute top-1/2 z-10 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow-md outline-hidden transition-transform focus-visible:ring-4 focus-visible:ring-modrinth-green/30 ${
              active ? 'border-modrinth-green' : 'border-gray-500'
            } ${dragging === handle.id ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'}`}
            style={{ left: percent(handle.value, handle.edge) }}
          >
            {dragging === handle.id ? (
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white shadow">
                {formatTime(handle.value)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="relative mt-0.5 h-3 text-[10px] font-medium tabular-nums text-gray-600 dark:text-gray-500" aria-hidden="true">
        {TICKS.map((hour) => (
          <span key={hour} className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: percent(hour * 60, false) }}>
            {formatTime(hour * 60)}
          </span>
        ))}
      </div>
    </div>
  )
}
