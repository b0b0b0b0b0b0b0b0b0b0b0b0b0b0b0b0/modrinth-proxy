'use client'

const STORAGE_KEY = 'kitten-sounds'
const listeners = new Set()
let context = null
let muted = null

function readMuted() {
  if (muted !== null) return muted
  try {
    muted = localStorage.getItem(STORAGE_KEY) === 'off'
  } catch {
    muted = false
  }
  return muted
}

export function soundsMuted() {
  return readMuted()
}

export function setSoundsMuted(next) {
  muted = next
  try {
    localStorage.setItem(STORAGE_KEY, next ? 'off' : 'on')
  } catch {}
  listeners.forEach((listener) => listener(next))
}

export function onSoundsMutedChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function audio() {
  if (readMuted() || typeof window === 'undefined') return null
  const Context = window.AudioContext || window.webkitAudioContext
  if (!Context) return null
  if (!context) context = new Context()
  if (context.state === 'suspended') context.resume().catch(() => {})
  return context
}

function tone(ctx, { type = 'sine', from, to = from, start = 0, attack = 0.006, length, volume, cutoff = 2400 }) {
  const at = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, at)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + length * 0.8)
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(volume, at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(filter).connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + length + 0.05)
}

const vary = (value, spread) => value * (1 + (Math.random() * 2 - 1) * spread)

export function playPop() {
  const ctx = audio()
  if (!ctx) return
  tone(ctx, { from: vary(620, 0.15), to: vary(210, 0.1), length: 0.14, volume: 0.13, cutoff: 1800 })
  tone(ctx, { from: vary(1240, 0.15), to: vary(500, 0.1), length: 0.06, volume: 0.03, cutoff: 3000 })
}

export function playChime() {
  const ctx = audio()
  if (!ctx) return
  const base = vary(1046, 0.03)
  tone(ctx, { from: base, length: 0.45, volume: 0.05, attack: 0.012 })
  tone(ctx, { from: base * 1.26, start: 0.09, length: 0.55, volume: 0.045, attack: 0.012 })
  tone(ctx, { from: base * 1.5, start: 0.18, length: 0.6, volume: 0.03, attack: 0.012 })
}

export function playBloop() {
  const ctx = audio()
  if (!ctx) return
  tone(ctx, { from: vary(200, 0.08), to: vary(340, 0.08), length: 0.2, volume: 0.07, attack: 0.012, cutoff: 1200 })
}

export function playMew() {
  const ctx = audio()
  if (!ctx) return
  const at = ctx.currentTime
  const base = vary(620, 0.06)
  const osc = ctx.createOscillator()
  const vibrato = ctx.createOscillator()
  const vibratoDepth = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(base * 0.8, at)
  osc.frequency.exponentialRampToValueAtTime(base * 1.35, at + 0.16)
  osc.frequency.exponentialRampToValueAtTime(base * 0.9, at + 0.5)
  vibrato.frequency.value = 7
  vibratoDepth.gain.value = base * 0.015
  vibrato.connect(vibratoDepth).connect(osc.frequency)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(900, at)
  filter.frequency.exponentialRampToValueAtTime(2200, at + 0.16)
  filter.frequency.exponentialRampToValueAtTime(1000, at + 0.5)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.06, at + 0.05)
  gain.gain.setValueAtTime(0.06, at + 0.3)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.55)
  osc.connect(filter).connect(gain).connect(ctx.destination)
  osc.start(at)
  vibrato.start(at)
  osc.stop(at + 0.6)
  vibrato.stop(at + 0.6)
}
